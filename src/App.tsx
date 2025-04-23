import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Bike, MapPin, Phone, LogIn, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import 'leaflet/dist/leaflet.css';
import './App.css';

type Station = Database['public']['Tables']['stations']['Row'] & {
  availableBikes: number;
};

function App() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Fetch stations and available bikes
    async function fetchStations() {
      const { data: stationsData, error: stationsError } = await supabase
        .from('stations')
        .select('*');

      if (stationsError) {
        toast({
          title: 'Error fetching stations',
          description: stationsError.message,
          variant: 'destructive',
        });
        return;
      }

      const { data: bikesData, error: bikesError } = await supabase
        .from('bikes')
        .select('station_id, status');

      if (bikesError) {
        toast({
          title: 'Error fetching bikes',
          description: bikesError.message,
          variant: 'destructive',
        });
        return;
      }

      const stationsWithBikes = stationsData.map(station => ({
        ...station,
        availableBikes: bikesData.filter(
          bike => bike.station_id === station.id && bike.status === 'available'
        ).length,
      }));

      setStations(stationsWithBikes);
    }

    fetchStations();

    // Subscribe to real-time changes
    const bikesSubscription = supabase
      .channel('bikes-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bikes' },
        () => fetchStations()
      )
      .subscribe();

    return () => {
      bikesSubscription.unsubscribe();
    };
  }, [toast]);

  const handleLogin = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: 'Error signing in',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Signed in successfully',
        description: 'Welcome back!',
      });
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      toast({
        title: 'Error signing up',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Signed up successfully',
        description: 'Please check your email to confirm your account.',
      });
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: 'Error signing out',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleReserveBike = async (stationId: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to reserve a bike.',
        variant: 'destructive',
      });
      return;
    }

    const { data: availableBike, error: bikeError } = await supabase
      .from('bikes')
      .select('id')
      .eq('station_id', stationId)
      .eq('status', 'available')
      .limit(1)
      .single();

    if (bikeError || !availableBike) {
      toast({
        title: 'No bikes available',
        description: 'Sorry, there are no bikes available at this station.',
        variant: 'destructive',
      });
      return;
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000); // 24 hours rental

    const { error: reservationError } = await supabase
      .from('reservations')
      .insert({
        user_id: user.id,
        bike_id: availableBike.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      });

    if (reservationError) {
      toast({
        title: 'Error making reservation',
        description: reservationError.message,
        variant: 'destructive',
      });
      return;
    }

    const { error: updateError } = await supabase
      .from('bikes')
      .update({ status: 'reserved' })
      .eq('id', availableBike.id);

    if (updateError) {
      toast({
        title: 'Error updating bike status',
        description: updateError.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Bike reserved successfully',
      description: 'You can now pick up your bike at the station.',
    });
  };

  return (
    <>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <div className="w-1/3 p-4 overflow-auto border-r">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Bike className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold">Amsterdam Bike Rental</h1>
            </div>
            {!loading && (
              user ? (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <LogIn className="w-4 h-4 mr-2" />
                      Login
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Login or Sign Up</DialogTitle>
                      <DialogDescription>
                        Enter your email and password to continue.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const email = formData.get('email') as string;
                      const password = formData.get('password') as string;
                      const isLogin = (e.nativeEvent as SubmitEvent).submitter?.getAttribute('data-action') === 'login';
                      if (isLogin) {
                        handleLogin(email, password);
                      } else {
                        handleSignUp(email, password);
                      }
                    }}>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" name="email" type="email" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input id="password" name="password" type="password" required />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" data-action="login">Login</Button>
                          <Button type="submit" variant="outline" data-action="signup">Sign Up</Button>
                        </div>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )
            )}
          </div>
          
          <div className="space-y-4">
            {stations.map(station => (
              <Card 
                key={station.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  selectedStation?.id === station.id ? 'border-primary' : ''
                }`}
                onClick={() => setSelectedStation(station)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{station.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {station.address}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Bike className="w-4 h-4" />
                      <span>{station.availableBikes} bikes available</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleReserveBike(station.id)}
                        disabled={!user || station.availableBikes === 0}
                      >
                        Reserve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => window.location.href = `tel:${station.phone}`}
                      >
                        <Phone className="w-4 h-4" />
                        Call
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="w-2/3 h-full">
          <MapContainer
            center={[52.3676, 4.9041]}
            zoom={13}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {stations.map(station => (
              <Marker
                key={station.id}
                position={[station.latitude, station.longitude]}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold">{station.name}</h3>
                    <p className="text-sm text-muted-foreground">{station.address}</p>
                    <p className="mt-2">
                      <span className="font-semibold">{station.availableBikes}</span> bikes available
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleReserveBike(station.id)}
                        disabled={!user || station.availableBikes === 0}
                      >
                        Reserve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.location.href = `tel:${station.phone}`}
                      >
                        Call
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
      <Toaster />
    </>
  );
}

export default App;