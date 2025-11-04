import { Bell, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import api  from '@/lib/api';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const [propertyOpen, setPropertyOpen] = useState(false);
  const [landlordOpen, setLandlordOpen] = useState(false);
  const [applicantOpen, setApplicantOpen] = useState(false);
  const { toast } = useToast();

  const handlePropertySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.post('/properties/', {
        address_line1: formData.get('address'),
        city: formData.get('city'),
        postcode: formData.get('postcode'),
        property_type: formData.get('property_type'),
        bedrooms: parseInt(formData.get('bedrooms') as string),
        bathrooms: parseInt(formData.get('bathrooms') as string),
        rent: parseFloat(formData.get('rent') as string),
        status: 'available'
      });
      toast({ title: 'Success', description: 'Property added successfully' });
      setPropertyOpen(false);
      window.location.reload();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add property', variant: 'destructive' });
    }
  };

  const handleLandlordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.post('/landlords/', {
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address')
      });
      toast({ title: 'Success', description: 'Landlord added successfully' });
      setLandlordOpen(false);
      window.location.reload();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add landlord', variant: 'destructive' });
    }
  };

  const handleApplicantSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.post('/applicants/', {
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        rent_budget_min: parseFloat(formData.get('rent_budget_min') as string),
        rent_budget_max: parseFloat(formData.get('rent_budget_max') as string)
      });
      toast({ title: 'Success', description: 'Applicant added successfully' });
      setApplicantOpen(false);
      window.location.reload();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add applicant', variant: 'destructive' });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" className="gap-2">
                <Plus className="h-4 w-4" />
                Quick Add
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setPropertyOpen(true)}>+ New Property</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLandlordOpen(true)}>+ New Landlord</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setApplicantOpen(true)}>+ New Applicant</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
              3
            </span>
          </Button>
        </div>
      </header>

      {/* Property Dialog */}
      <Dialog open={propertyOpen} onOpenChange={setPropertyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
            <DialogDescription>Enter the property details below</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePropertySubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input id="postcode" name="postcode" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="property_type">Type</Label>
                <Select name="property_type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="maisonette">Maisonette</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input id="bedrooms" name="bedrooms" type="number" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input id="bathrooms" name="bathrooms" type="number" required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rent">Monthly Rent (£)</Label>
                <Input id="rent" name="rent" type="number" step="0.01" required />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Add Property</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Landlord Dialog */}
      <Dialog open={landlordOpen} onOpenChange={setLandlordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Landlord</DialogTitle>
            <DialogDescription>Enter the landlord details below</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLandlordSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" name="full_name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Add Landlord</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Applicant Dialog */}
      <Dialog open={applicantOpen} onOpenChange={setApplicantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Applicant</DialogTitle>
            <DialogDescription>Enter the applicant details below</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleApplicantSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" name="first_name" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" name="last_name" required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="rent_budget_min">Min Budget (£)</Label>
                  <Input id="rent_budget_min" name="rent_budget_min" type="number" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rent_budget_max">Max Budget (£)</Label>
                  <Input id="rent_budget_max" name="rent_budget_max" type="number" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Add Applicant</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}