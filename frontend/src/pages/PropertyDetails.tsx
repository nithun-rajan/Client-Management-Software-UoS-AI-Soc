import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Bed, Bath, PoundSterling, MapPin, ArrowLeft, Activity, Eye, Pencil, FileText, Upload, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/shared/StatusBadge';
import api from '@/lib/api';


export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast(); 
  
  const handleSendEmail = () => {
  console.log('📧 Sending email for property:', property.id);
  toast({ 
    title: 'Email Sent', 
    description: `Property details sent to interested parties`,
  });
  };
  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const response = await api.get(`/api/v1/properties/${id}/`);
      return response.data;
    },
  
  });

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

  return (
    <div>
      <Header title="Property Details" />
      <div className="p-6 space-y-6">
        <Button variant="outline" onClick={() => navigate('/properties')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Properties
        </Button>
        <Button onClick={handleSendEmail}>
          <Mail className="h-4 w-4 mr-2" />
          Send Details
        </Button>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{property.address_line1}</CardTitle>
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
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <Building2 className="h-24 w-24 text-muted-foreground" />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Bed className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{property.bedrooms}</div>
                  <div className="text-sm text-muted-foreground">Bedrooms</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Bath className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{property.bathrooms}</div>
                  <div className="text-sm text-muted-foreground">Bathrooms</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Building2 className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-sm font-medium capitalize">{property.property_type}</div>
                  <div className="text-sm text-muted-foreground">Type</div>
                </div>
              </div>

              {property.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{property.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                {property.rent ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-3xl font-bold text-primary">
                      <PoundSterling className="h-8 w-8" />
                      {property.rent.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">per calendar month</p>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">Price on application</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium capitalize">{property.status.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property Type</span>
                  <span className="font-medium capitalize">{property.property_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bedrooms</span>
                  <span className="font-medium">{property.bedrooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bathrooms</span>
                  <span className="font-medium">{property.bathrooms}</span>
                </div>
                {/* maybe here???? cuz it kinda makes sense to be here; Activity Timeline */}
              </CardContent>
            </Card>
            {/* Activity Timeline */}
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                      <Building2 className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Property Created</p>
                      <p className="text-sm text-muted-foreground">
                        {property.created_at ? new Date(property.created_at).toLocaleDateString() : 'Recently'}
                      </p>
                    </div>
                  </div>
                  {property.updated_at && property.updated_at !== property.created_at && (
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Pencil className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Property Updated</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(property.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <Eye className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Viewed Just Now</p>
                      <p className="text-sm text-muted-foreground">You are viewing this property</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Documents Section */}
            <Card className="md:col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents
                  </CardTitle>
                  <Button size="sm" variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-100">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Energy Performance Certificate</p>
                        <p className="text-xs text-muted-foreground">Valid until Dec 2025</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-green-100">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Gas Safety Certificate</p>
                        <p className="text-xs text-muted-foreground">Valid until Jan 2026</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    + Add more documents
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}