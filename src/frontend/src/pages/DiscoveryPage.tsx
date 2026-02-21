import { useState, useEffect } from 'react';
import { useGetBookablesNearLocation } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Loader2, MapPin, Briefcase, Phone, Smartphone } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import type { LaborerData } from '../backend';

export default function DiscoveryPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const { data: laborers, isLoading } = useGetBookablesNearLocation(searchLocation, BigInt(10));

  useEffect(() => {
    if (!identity) {
      navigate({ to: '/' });
    }
  }, [identity, navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[DiscoveryPage] Search submitted with location:', location);
    setSearchLocation(location);
  };

  const handleBookNowClick = (laborerId: string, laborerName: string) => {
    console.log('[DiscoveryPage] Book Now clicked for laborer:', laborerName, 'ID:', laborerId);
    
    try {
      console.log('[DiscoveryPage] Attempting navigation to:', `/book/${laborerId}`);
      navigate({ 
        to: '/book/$laborerId', 
        params: { laborerId } 
      });
      console.log('[DiscoveryPage] Navigation initiated successfully');
    } catch (error) {
      console.error('[DiscoveryPage] Navigation error:', error);
      toast.error('Failed to navigate to booking page. Please try again.');
    }
  };

  const getAvailabilityColor = (status: LaborerData['availability']['status']) => {
    switch (status.__kind__) {
      case 'available':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'unavailable':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      case 'onJob':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getAvailabilityText = (status: LaborerData['availability']['status']) => {
    switch (status.__kind__) {
      case 'available':
        return 'Available';
      case 'unavailable':
        return 'Unavailable';
      case 'onJob':
        return 'On Job';
      case 'pending':
        return 'Pending';
      case 'custom':
        return status.custom;
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Find Laborers</h1>
        <p className="text-muted-foreground">Discover skilled workers in your area</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search by Location</CardTitle>
          <CardDescription>Enter a neighborhood or area to find nearby laborers</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1">
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Downtown, Westside"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && laborers && laborers.length === 0 && searchLocation && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No laborers found in this area. Try a different location.</p>
        </div>
      )}

      {!isLoading && laborers && laborers.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {laborers.map((laborer) => (
            <Card key={laborer.id.toString()} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{laborer.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {laborer.location}
                    </CardDescription>
                  </div>
                  <Badge className={getAvailabilityColor(laborer.availability.status)}>
                    {getAvailabilityText(laborer.availability.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    Skills
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {laborer.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {laborer.services.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Services</div>
                    <div className="space-y-1">
                      {laborer.services.slice(0, 3).map((service, idx) => (
                        <div key={idx} className="text-sm flex justify-between">
                          <span className="text-muted-foreground">{service.name}</span>
                          <span className="font-semibold text-amber-600">${service.price.toString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Smartphone className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-foreground">{laborer.mobileNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {laborer.contact}
                  </div>
                </div>

                <Button 
                  onClick={() => handleBookNowClick(laborer.id.toString(), laborer.name)}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                >
                  Book Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
