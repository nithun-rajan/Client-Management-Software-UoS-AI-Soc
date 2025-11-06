import { UserCheck, Mail, Phone, Building2, Eye, Pencil, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLandlords } from '@/hooks/useLandlords';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/layout/Header';
import { Link } from 'react-router-dom';

export default function Landlords() {
  const { data: landlords, isLoading } = useLandlords();

  if (isLoading) {
    return (
      <div>
        <Header title="Landlords" />
        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
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

  const getAMLStatus = (expiryDate: string | null | undefined) => {
    if (!expiryDate) {
      return { level: 'red', label: 'No AML', days: 0, className: 'bg-red-500 text-white' };
    }

    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { level: 'red', label: `Expired ${Math.abs(daysUntilExpiry)}d ago`, days: daysUntilExpiry, className: 'bg-red-500 text-white' };
    } else if (daysUntilExpiry < 90) {
      return { level: 'red', label: `Expires in ${daysUntilExpiry}d`, days: daysUntilExpiry, className: 'bg-red-500 text-white' };
    } else if (daysUntilExpiry < 365) {
      return { level: 'amber', label: `${daysUntilExpiry}d remaining`, days: daysUntilExpiry, className: 'bg-amber-500 text-white' };
    } else {
      return { level: 'green', label: 'Compliant', days: daysUntilExpiry, className: 'bg-green-500 text-white' };
    }
  };

  return (
    <div>
      <Header title="Landlords" />
      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2">
          {landlords?.map((landlord) => (
            <Card key={landlord.id} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary text-white font-bold text-xl shrink-0">
                    {getInitials(landlord.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{landlord.full_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {(() => {
                        const amlStatus = getAMLStatus(landlord.aml_check_expiry);
                        return (
                          <Badge className={`${amlStatus.className} gap-1 font-medium`}>
                            {amlStatus.level === 'red' ? (
                              <AlertCircle className="h-3 w-3" />
                            ) : amlStatus.level === 'amber' ? (
                              <AlertCircle className="h-3 w-3" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                            AML: {amlStatus.label}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{landlord.email}</span>
                </div>
                {landlord.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{landlord.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                  <Building2 className="h-4 w-4" />
                  <span>Properties owned: 0</span>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link to={`/landlords/${landlord.id}`}>
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Link>
                </Button>
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {landlords?.length === 0 && (
          <div className="text-center py-12">
            <UserCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No landlords yet</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first landlord</p>
            <Button>+ Add Landlord</Button>
          </div>
        )}
      </div>
    </div>
  );
}
