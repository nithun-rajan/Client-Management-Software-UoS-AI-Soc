import { useParams, useNavigate } from 'react-router-dom';
import { UserCheck, Mail, Phone, MapPin, Building2, ArrowLeft, CheckCircle, AlertCircle} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';


export default function LandlordDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: landlord, isLoading } = useQuery({
    queryKey: ['landlord', id],
    queryFn: async () => {
      const response = await api.get(`/api/v1/landlords/${id}/`);
      return response.data;
    },
  });
const handleSendEmail = () => {
  console.log('📧 Sending email for property:', landlord.id);
  toast({ 
    title: 'Email Sent', 
    description: `Property details sent to interested parties`,
  });
};
  if (isLoading) {
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
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div>
      <Header title="Landlord Details" />
      <div className="p-6 space-y-6">
        <Button variant="outline" onClick={() => navigate('/landlords')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Landlords
        </Button>
        <Button onClick={handleSendEmail}>
          <Mail className="h-4 w-4 mr-2" />
          Send Details
        </Button>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-primary text-white font-bold text-3xl shrink-0">
                  {getInitials(landlord.full_name)}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl">{landlord.full_name}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    {landlord.aml_verified ? (
                      <Badge className="bg-accent text-white gap-1">
                        <CheckCircle className="h-3 w-3" />
                        AML Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Pending Verification
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-medium">{landlord.email}</div>
                    </div>
                  </div>
                  {landlord.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Phone</div>
                        <div className="font-medium">{landlord.phone}</div>
                      </div>
                    </div>
                  )}
                  {landlord.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Address</div>
                        <div className="font-medium">{landlord.address}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {landlord.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-muted-foreground">{landlord.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">AML Status</span>
                  {landlord.aml_verified ? (
                    <CheckCircle className="h-5 w-5 text-accent" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                  )}
                </div>
                {landlord.aml_verification_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verified On</span>
                    <span className="font-medium">{new Date(landlord.aml_verification_date).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {(landlord.bank_account_name || landlord.sort_code || landlord.account_number) && (
              <Card>
                <CardHeader>
                  <CardTitle>Banking Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {landlord.bank_account_name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Name</span>
                      <span className="font-medium">{landlord.bank_account_name}</span>
                    </div>
                  )}
                  {landlord.sort_code && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sort Code</span>
                      <span className="font-medium">{landlord.sort_code}</span>
                    </div>
                  )}
                  {landlord.account_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Number</span>
                      <span className="font-medium">****{landlord.account_number.slice(-4)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Portfolio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-3xl font-bold">0</div>
                  <p className="text-sm text-muted-foreground">Properties</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}