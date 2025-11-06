import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Bed, Bath, PoundSterling, MapPin, ArrowLeft, Mail, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/shared/StatusBadge';
import api from '@/lib/api';
import { format } from 'date-fns';

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const response = await api.get(`/api/v1/properties/${id}`);
      return response.data;
    },
  });

  const handleSendEmail = () => {
    toast({
      title: 'Email Sent',
      description: 'Property details sent to interested parties',
    });
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Property Details" />
        <div className="p-6">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div>
        <Header title="Property Details" />
        <div className="p-6">
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Property not found</h3>
            <Button onClick={() => navigate('/properties')}>Back to Properties</Button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div>
      <Header title="Property Details" />
      <div className="p-6 space-y-6">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/properties')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
          <Button onClick={handleSendEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Send Details
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{property.address_line1 || property.address}</CardTitle>
                  {property.address_line2 && <p className="text-muted-foreground">{property.address_line2}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{property.city}, {property.postcode}</span>
                  </div>
                </div>
                <StatusBadge status={property.status} />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={`https://picsum.photos/seed/building${property.id}/800/450`}
                  alt={property.address_line1 || property.address}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Bed className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Bedrooms</p>
                    <p className="font-semibold">{property.bedrooms}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Bathrooms</p>
                    <p className="font-semibold">{property.bathrooms}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <PoundSterling className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Rent (PCM)</p>
                    <p className="font-semibold">£{property.asking_rent || property.rent}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-semibold capitalize">{property.property_type}</p>
                  </div>
                </div>
              </div>

              {property.floor_area_sqft && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">Floor Area</p>
                  <p className="font-semibold">{property.floor_area_sqft} sq ft</p>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Features</h3>
                <div className="flex flex-wrap gap-2">
                  {property.furnished && <Badge>Furnished</Badge>}
                  {property.parking && <Badge>Parking</Badge>}
                  {property.garden && <Badge>Garden</Badge>}
                  {property.epc_rating && <Badge>EPC: {property.epc_rating}</Badge>}
                </div>
              </div>

              {property.description && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">{property.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm font-medium">Listed</p>
                    <p className="text-sm text-muted-foreground">{formatDate(property.listed_date)}</p>
                  </div>
                </div>
                {property.let_agreed_date && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm font-medium">Let Agreed</p>
                      <p className="text-sm text-muted-foreground">{formatDate(property.let_agreed_date)}</p>
                    </div>
                  </div>
                )}
                {property.let_date && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm font-medium">Let Date</p>
                      <p className="text-sm text-muted-foreground">{formatDate(property.let_date)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {property.deposit && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Financial</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Deposit</p>
                    <p className="font-semibold">£{property.deposit}</p>
                  </div>
                  {property.rent && property.asking_rent && property.rent !== property.asking_rent && (
                    <div>
                      <p className="text-sm text-muted-foreground">Asking Rent</p>
                      <p className="font-semibold">£{property.asking_rent}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {property.landlord_id && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Landlord</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/landlords/${property.landlord_id}`)}
                    className="w-full"
                  >
                    View Landlord Details
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

