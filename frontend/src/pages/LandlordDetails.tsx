import { useParams, useNavigate } from 'react-router-dom';
import { UserCheck, Mail, Phone, ArrowLeft, Building2, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import api from '@/lib/api';

export default function LandlordDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: landlord, isLoading: landlordLoading } = useQuery({
    queryKey: ['landlord', id],
    queryFn: async () => {
      const response = await api.get(`/api/v1/landlords/${id}`);
      return response.data;
    },
  });

  const { data: properties } = useQuery({
    queryKey: ['landlord-properties', id],
    queryFn: async () => {
      const response = await api.get(`/api/v1/properties/?landlord_id=${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const handleSendEmail = () => {
    toast({
      title: 'Email Sent',
      description: `Email sent to ${landlord?.email}`,
    });
  };

  if (landlordLoading) {
    return (
      <div>
        <Header title="Landlord Details" />
        <div className="p-6">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!landlord) {
    return (
      <div>
        <Header title="Landlord Details" />
        <div className="p-6">
          <div className="text-center py-12">
            <UserCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Landlord not found</h3>
            <Button onClick={() => navigate('/landlords')}>Back to Landlords</Button>
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div>
      <Header title="Landlord Details" />
      <div className="p-6 space-y-6">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/landlords')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Landlords
          </Button>
          <Button onClick={handleSendEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary text-white text-2xl font-semibold">
                  {getInitials(landlord.full_name)}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl">{landlord.full_name}</CardTitle>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {landlord.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {landlord.email}
                      </div>
                    )}
                    {landlord.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {landlord.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {landlord.address && (
                <div>
                  <h3 className="font-semibold mb-2">Address</h3>
                  <p className="text-sm text-muted-foreground">{landlord.address}</p>
                </div>
              )}

              {(landlord.aml_verified || landlord.aml_check_expiry) && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Compliance Status</h3>
                  <div className="space-y-2">
                    {landlord.aml_verified && (
                      <Badge variant="default">AML Verified</Badge>
                    )}
                    {landlord.aml_verification_date && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Verified:</span>{' '}
                        {new Date(landlord.aml_verification_date).toLocaleDateString()}
                      </p>
                    )}
                    {landlord.aml_check_expiry && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Expires:</span>{' '}
                        {new Date(landlord.aml_check_expiry).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {(landlord.bank_account_name || landlord.account_number) && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Banking Details</h3>
                  <div className="space-y-1">
                    {landlord.bank_account_name && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Account Name:</span> {landlord.bank_account_name}
                      </p>
                    )}
                    {landlord.sort_code && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Sort Code:</span> {landlord.sort_code}
                      </p>
                    )}
                    {landlord.account_number && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Account:</span> ****{landlord.account_number.slice(-4)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {landlord.notes && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground">{landlord.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Properties</span>
                    <span className="font-semibold">{properties?.length || 0}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/properties?landlord_id=${id}`)}
                    className="w-full"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    View All Properties
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Communications</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/messages?landlord_id=${id}`)}
                  className="w-full"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View Communications
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {properties && properties.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Properties Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {properties.slice(0, 6).map((property: any) => (
                  <div
                    key={property.id}
                    className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => navigate(`/properties/${property.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{property.address_line1 || property.address}</h4>
                      <Badge variant="secondary">{property.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{property.city}, {property.postcode}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span>{property.bedrooms} bed</span>
                      <span>£{property.asking_rent || property.rent} pcm</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

