import { Users, Mail, Phone, Bed, PoundSterling, Eye, Pencil, Trash2, Dog } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApplicants } from '@/hooks/useApplicants';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/shared/StatusBadge';
import { Link } from 'react-router-dom';

export default function Applicants() {
  const { data: applicants, isLoading } = useApplicants();

  if (isLoading) {
    return (
      <div>
        <Header title="Applicants" />
        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <div>
      <Header title="Applicants" />
      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {applicants?.map((applicant) => (
            <Card key={applicant.id} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary text-white font-bold shrink-0">
                    {getInitials(applicant.first_name, applicant.last_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {applicant.first_name} {applicant.last_name}
                    </h3>
                    <StatusBadge status={applicant.status} className="mt-1" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{applicant.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{applicant.phone}</span>
                </div>
                {applicant.desired_bedrooms && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Bed className="h-4 w-4 shrink-0" />
                    <span>{applicant.desired_bedrooms} beds</span>
                  </div>
                )}
                {(applicant.rent_budget_min || applicant.rent_budget_max) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <PoundSterling className="h-4 w-4 shrink-0" />
                    <span>
                      £{applicant.rent_budget_min || 0} - £{applicant.rent_budget_max || 0} pcm
                    </span>
                  </div>
                )}
                {applicant.has_pets && (
                  <div className="flex items-center gap-2 text-sm text-accent">
                    <Dog className="h-4 w-4 shrink-0" />
                    <span>Pet friendly</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link to={`/applicants/${applicant.id}`}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
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

        {applicants?.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No applicants yet</h3>
            <p className="text-muted-foreground mb-4">Get started by adding your first applicant</p>
            <Button>+ Add Applicant</Button>
          </div>
        )}
      </div>
    </div>
  );
}
