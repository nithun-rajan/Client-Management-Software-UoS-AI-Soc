import { Bell, Plus, TrendingUp, Sparkles, Camera, Search, MapPin, History, ExternalLink, TrendingDown, Minus, Home, Zap, AlertTriangle, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import api  from '@/lib/api';
import { usePropertyLookup, useSuggestedRent, useAIRentEstimate } from '@/hooks/useLandRegistry';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const [propertyOpen, setPropertyOpen] = useState(false);
  const [landlordOpen, setLandlordOpen] = useState(false);
  const [applicantOpen, setApplicantOpen] = useState(false);
  const { toast } = useToast();

  // Property lookup state (Alto-style!)
  const [lookupHouseNumber, setLookupHouseNumber] = useState('');
  const [lookupPostcode, setLookupPostcode] = useState('');
  const [showLookupResults, setShowLookupResults] = useState(false);
  const [enableLookup, setEnableLookup] = useState(false);
  
  // Property form state
  const [postcode, setPostcode] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Lookup property data
  const { data: lookupData, isLoading: isLoadingLookup, refetch: refetchLookup } = usePropertyLookup(
    lookupHouseNumber,
    lookupPostcode,
    enableLookup
  );
  
  // Get market data when postcode is entered
  const { suggestedRent, rentRange, areaStats, isLoading: isLoadingMarketData } = useSuggestedRent(
    postcode,
    propertyType,
    bedrooms ? parseInt(bedrooms) : undefined,
    postcode.length >= 5 // Only fetch when postcode is valid
  );
  
  // AI-Powered Rent Estimation
  const aiRentMutation = useAIRentEstimate();
  const [showAIEstimate, setShowAIEstimate] = useState(false);
  const [aiEstimateData, setAIEstimateData] = useState<any>(null);

  // Handle lookup
  const handleLookup = () => {
    if (lookupHouseNumber && lookupPostcode && lookupPostcode.length >= 5) {
      setEnableLookup(true);
      setShowLookupResults(true);
      refetchLookup();
    }
  };
  
  // Handle AI Rent Estimation
  const handleAIRentEstimate = async () => {
    if (!lookupHouseNumber || !lookupPostcode) {
      toast({
        title: 'Missing Information',
        description: 'Please enter house number and postcode in the Property Lookup section first.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const result = await aiRentMutation.mutateAsync({
        house_number: lookupHouseNumber,
        postcode: lookupPostcode,
      });
      
      setAIEstimateData(result);
      setShowAIEstimate(true);
      
      toast({
        title: 'AI Analysis Complete! 🤖',
        description: `Estimated rent: £${result.ai_estimate.monthly_rent}/month`,
      });
    } catch (error: any) {
      toast({
        title: 'AI Estimation Failed',
        description: error.response?.data?.detail || 'Please check your OpenAI API key configuration.',
        variant: 'destructive',
      });
    }
  };

  // Auto-fill form from lookup data
  const autoFillFromLookup = () => {
    if (lookupData && lookupData.found) {
      setPostcode(lookupData.postcode);
      setPropertyType(lookupData.property_type?.toLowerCase() || '');
      setShowLookupResults(false);
      toast({ 
        title: '✨ Auto-filled!', 
        description: 'Property details loaded from Land Registry' 
      });
    }
  };

  const handlePropertySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const addressLine1 = formData.get('address') as string;
      const city = formData.get('city') as string;
      const fullAddress = `${addressLine1}, ${city}`;
      
      await api.post('/api/v1/properties/', {
        address: fullAddress,  // Required field
        address_line1: addressLine1,
        city: city,
        postcode: formData.get('postcode'),
        property_type: formData.get('property_type'),
        bedrooms: parseInt(formData.get('bedrooms') as string),
        bathrooms: parseInt(formData.get('bathrooms') as string),
        rent: parseFloat(formData.get('rent') as string),
        image_url: imageUrl || null,  // Include image URL
        status: 'available'
      });
      toast({ 
        title: '✨ Success!', 
        description: 'Property added with AI-powered market insights' 
      });
      setPropertyOpen(false);
      // Reset form
      setPostcode('');
      setPropertyType('');
      setBedrooms('');
      setImageUrl('');
      window.location.reload();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add property', variant: 'destructive' });
    }
  };

  const handleLandlordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.post('/api/v1/landlords/', {
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
      await api.post('/api/v1/applicants/', {
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

      {/* Property Dialog - Enhanced with AI */}
      <Dialog open={propertyOpen} onOpenChange={(open) => {
        setPropertyOpen(open);
        if (!open) {
          // Reset form when closing
          setPostcode('');
          setPropertyType('');
          setBedrooms('');
          setImageUrl('');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Add New Property - AI Assisted
            </DialogTitle>
            <DialogDescription>
              Enter the postcode first, and we'll help you with market data and pricing suggestions
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePropertySubmit}>
            <div className="grid gap-4 py-4">
              {/* Property Lookup Section - Alto Style! */}
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    🏠 Property Lookup (Like Alto!)
                  </CardTitle>
                  <CardDescription>
                    Enter house number + postcode to get exact property details from Land Registry
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-[1fr_2fr_auto] gap-2">
                    <Input
                      placeholder="House #"
                      value={lookupHouseNumber}
                      onChange={(e) => setLookupHouseNumber(e.target.value)}
                    />
                    <Input
                      placeholder="Postcode (e.g., SW1A 1AA)"
                      value={lookupPostcode}
                      onChange={(e) => setLookupPostcode(e.target.value.toUpperCase())}
                    />
                    <Button 
                      type="button" 
                      onClick={handleLookup}
                      disabled={isLoadingLookup || !lookupHouseNumber || !lookupPostcode}
                      className="gap-2"
                    >
                      <Search className="h-4 w-4" />
                      {isLoadingLookup ? 'Looking up...' : 'Lookup'}
                    </Button>
                  </div>

                  {/* Lookup Results */}
                  {showLookupResults && lookupData && (
                    <div className="mt-4 space-y-3 max-h-[600px] overflow-y-auto">
                      {lookupData.found ? (
                        <>
                          {/* Property Found Header */}
                          <Alert className="border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <AlertDescription>
                              <div className="space-y-2">
                                <p className="font-bold text-green-900 dark:text-green-100 text-lg">
                                  ✅ Property Found in Database!
                                </p>
                                <div className="text-sm space-y-1 text-green-800 dark:text-green-200">
                                  <p className="font-semibold">
                                    {lookupData.raw_data?.attributes?.address?.royal_mail_format?.organisation_name || lookupData.full_address}
                                  </p>
                                  <p className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    {lookupData.raw_data?.attributes?.address?.royal_mail_format?.building_number || ''} {lookupData.raw_data?.attributes?.address?.royal_mail_format?.thoroughfare || lookupData.street}
                                    {lookupData.raw_data?.attributes?.address?.royal_mail_format?.post_town && `, ${lookupData.raw_data.attributes.address.royal_mail_format.post_town}`}
                                    {' '}{lookupData.postcode}
                                  </p>
                                  {lookupData.raw_data?.attributes?.address?.is_none_residential && (
                                    <Badge variant="secondary" className="mt-1">Commercial Property</Badge>
                                  )}
                                </div>
                              </div>
                            </AlertDescription>
                          </Alert>

                          {/* Property Characteristics Grid */}
                          <Card className="border-2 border-primary/30">
                            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-background">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Home className="h-4 w-4" />
                                Property Details
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-3 gap-4">
                                {/* Property Type */}
                                {lookupData.raw_data?.attributes?.property_type?.value && (
                                  <div className="text-center p-3 rounded-lg bg-muted">
                                    <p className="text-xs text-muted-foreground">Type</p>
                                    <p className="font-semibold text-sm">{lookupData.raw_data.attributes.property_type.value}</p>
                                  </div>
                                )}
                                
                                {/* Bedrooms */}
                                {lookupData.bedrooms && (
                                  <div className="text-center p-3 rounded-lg bg-muted">
                                    <p className="text-xs text-muted-foreground">Bedrooms</p>
                                    <p className="font-bold text-lg">{lookupData.bedrooms}</p>
                                  </div>
                                )}
                                
                                {/* Bathrooms */}
                                {lookupData.bathrooms && (
                                  <div className="text-center p-3 rounded-lg bg-muted">
                                    <p className="text-xs text-muted-foreground">Bathrooms</p>
                                    <p className="font-bold text-lg">{lookupData.bathrooms}</p>
                                  </div>
                                )}
                                
                                {/* Floor Area */}
                                {lookupData.floor_area_sqm && (
                                  <div className="text-center p-3 rounded-lg bg-muted">
                                    <p className="text-xs text-muted-foreground">Floor Area</p>
                                    <p className="font-semibold text-sm">{lookupData.floor_area_sqm} m²</p>
                                  </div>
                                )}
                                
                                {/* Build Year */}
                                {lookupData.build_year && (
                                  <div className="text-center p-3 rounded-lg bg-muted">
                                    <p className="text-xs text-muted-foreground">Built</p>
                                    <p className="font-semibold text-sm">{lookupData.build_year}</p>
                                  </div>
                                )}
                                
                                {/* Tenure */}
                                {lookupData.tenure && (
                                  <div className="text-center p-3 rounded-lg bg-muted">
                                    <p className="text-xs text-muted-foreground">Tenure</p>
                                    <p className="font-semibold text-sm capitalize">{lookupData.tenure}</p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>

                          {/* EPC Rating */}
                          {lookupData.epc && (lookupData.epc.current_rating || lookupData.raw_data?.attributes?.epc?.current_energy_rating) && (
                            <Card className="border-blue-500/30">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <Zap className="h-4 w-4 text-blue-600" />
                                  Energy Performance Certificate (EPC)
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-2">Current Rating</p>
                                    <div className="flex items-center gap-2">
                                      <Badge className={`text-lg px-4 py-2 ${
                                        ['A', 'B'].includes(lookupData.epc.current_rating || lookupData.raw_data?.attributes?.epc?.current_energy_rating) ? 'bg-green-600' :
                                        ['C'].includes(lookupData.epc.current_rating || lookupData.raw_data?.attributes?.epc?.current_energy_rating) ? 'bg-lime-600' :
                                        ['D'].includes(lookupData.epc.current_rating || lookupData.raw_data?.attributes?.epc?.current_energy_rating) ? 'bg-yellow-600' :
                                        'bg-orange-600'
                                      }`}>
                                        {lookupData.epc.current_rating || lookupData.raw_data?.attributes?.epc?.current_energy_rating}
                                      </Badge>
                                      <span className="text-sm font-medium">
                                        {lookupData.epc.current_efficiency || lookupData.raw_data?.attributes?.epc?.current_energy_efficiency || ''} points
                                      </span>
                                    </div>
                                  </div>
                                  {(lookupData.epc.potential_rating || lookupData.raw_data?.attributes?.epc?.potential_energy_rating) && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-2">Potential Rating</p>
                                      <div className="flex items-center gap-2">
                                        <Badge className="text-lg px-4 py-2 bg-green-600">
                                          {lookupData.epc.potential_rating || lookupData.raw_data?.attributes?.epc?.potential_energy_rating}
                                        </Badge>
                                        <span className="text-sm font-medium">
                                          {lookupData.epc.potential_efficiency || lookupData.raw_data?.attributes?.epc?.potential_energy_efficiency || ''} points
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Airport Noise Data */}
                          {lookupData.raw_data?.attributes?.airport_noise && (
                            <Card className="border-orange-500/30">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                                  Airport Noise Assessment
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Noise Level:</span>
                                    <Badge variant={
                                      lookupData.raw_data.attributes.airport_noise.category.includes('High') ? 'destructive' :
                                      lookupData.raw_data.attributes.airport_noise.category.includes('Medium') ? 'secondary' :
                                      'outline'
                                    }>
                                      {lookupData.raw_data.attributes.airport_noise.category} ({lookupData.raw_data.attributes.airport_noise.level} dB)
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {lookupData.raw_data.attributes.airport_noise.description}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Latest Sale Price with Trend */}
                          {lookupData.latest_sale && (
                            <Card className="border-primary bg-gradient-to-br from-primary/5 to-background">
                              <CardContent className="pt-6">
                                <div className="grid grid-cols-2 gap-6">
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Last Sold Price</p>
                                    <p className="text-3xl font-bold text-primary">
                                      £{lookupData.latest_sale.price.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(lookupData.latest_sale.date).toLocaleDateString('en-GB', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                      })}
                                    </p>
                                  </div>

                                  {/* Price Trend */}
                                  {lookupData.price_trend && (
                                    <div className="flex flex-col justify-center">
                                      <div className="p-4 rounded-lg bg-background border-2">
                                        <div className="flex items-center gap-2 mb-2">
                                          {lookupData.price_trend.direction === 'up' && <TrendingUp className="h-5 w-5 text-green-600" />}
                                          {lookupData.price_trend.direction === 'down' && <TrendingDown className="h-5 w-5 text-red-600" />}
                                          {lookupData.price_trend.direction === 'stable' && <Minus className="h-5 w-5 text-gray-600" />}
                                          <span className="text-xs font-medium">Price Trend</span>
                                        </div>
                                        <p className={`text-2xl font-bold ${
                                          lookupData.price_trend.direction === 'up' ? 'text-green-600' :
                                          lookupData.price_trend.direction === 'down' ? 'text-red-600' :
                                          'text-gray-600'
                                        }`}>
                                          {lookupData.price_trend.direction === 'up' ? '+' : ''}
                                          {lookupData.price_trend.change_percentage.toFixed(1)}%
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          £{Math.abs(lookupData.price_trend.change_amount).toLocaleString()} change
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Sales History */}
                          {lookupData.sales_history && lookupData.sales_history.length > 0 && (
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <History className="h-4 w-4" />
                                    Sales History
                                  </div>
                                  <Badge variant="secondary">{lookupData.total_sales} transactions</Badge>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                  {lookupData.sales_history.slice(0, 15).map((sale, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm p-3 rounded-lg hover:bg-muted transition-colors border">
                                      <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 rounded-full p-2">
                                          <Home className="h-3 w-3 text-primary" />
                                        </div>
                                        <div>
                                          <p className="font-semibold">
                                            {new Date(sale.date).toLocaleDateString('en-GB', {
                                              day: 'numeric',
                                              month: 'short',
                                              year: 'numeric'
                                            })}
                                          </p>
                                          <p className="text-xs text-muted-foreground capitalize">{sale.property_type || 'N/A'}</p>
                                        </div>
                                      </div>
                                      <p className="font-bold text-lg text-primary">£{sale.price.toLocaleString()}</p>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Location Details */}
                          {lookupData.raw_data?.attributes?.localities && (
                            <Card className="border-purple-500/30">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-purple-600" />
                                  Location Information
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  {lookupData.raw_data.attributes.localities.ward && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Ward</p>
                                      <p className="font-medium">{lookupData.raw_data.attributes.localities.ward}</p>
                                    </div>
                                  )}
                                  {lookupData.raw_data.attributes.localities.local_authority && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Local Authority</p>
                                      <p className="font-medium">{lookupData.raw_data.attributes.localities.local_authority}</p>
                                    </div>
                                  )}
                                  {lookupData.raw_data.attributes.localities.county && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">County</p>
                                      <p className="font-medium">{lookupData.raw_data.attributes.localities.county}</p>
                                    </div>
                                  )}
                                  {lookupData.raw_data.attributes.localities.police_force && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Police Force</p>
                                      <p className="font-medium">{lookupData.raw_data.attributes.localities.police_force}</p>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Google Maps Button */}
                          {lookupData.google_maps_url && (
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full gap-2 border-2"
                              size="lg"
                              onClick={() => window.open(lookupData.google_maps_url, '_blank')}
                            >
                              <MapPin className="h-4 w-4" />
                              View on Google Maps
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}

                          {/* Auto-Fill Button */}
                          <Button
                            type="button"
                            onClick={autoFillFromLookup}
                            className="w-full gap-2 shadow-lg"
                            size="lg"
                          >
                            <Sparkles className="h-4 w-4" />
                            Auto-Fill Form with Property Data
                          </Button>
                        </>
                      ) : (
                        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                          <AlertDescription className="text-yellow-900 dark:text-yellow-100">
                            ⚠️ {lookupData.message || 'Property not found in database'}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Separator className="my-2" />

              {/* Image Upload */}
              <div className="grid gap-2">
                <Label htmlFor="image_url" className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Property Image
                </Label>
                <Input 
                  id="image_url" 
                  name="image_url" 
                  placeholder="Paste image URL or leave blank for default"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                {imageUrl && (
                  <div className="rounded-lg overflow-hidden border">
                    <img src={imageUrl} alt="Property preview" className="w-full h-48 object-cover" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  💡 Tip: Use Unsplash, Pexels, or Google Street View for property images
                </p>
              </div>

              {/* Postcode - Primary input */}
              <div className="grid gap-2">
                <Label htmlFor="postcode" className="font-semibold">Postcode *</Label>
                <Input 
                  id="postcode" 
                  name="postcode" 
                  placeholder="e.g., SO15 2JS"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                  required 
                />
                {isLoadingMarketData && postcode.length >= 5 && (
                  <p className="text-xs text-muted-foreground animate-pulse">
                    🔍 Fetching market data...
                  </p>
                )}
              </div>

              {/* Market Data Alert */}
              {areaStats && areaStats.total_sales > 0 && (
                <Alert className="border-primary bg-primary/5">
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-semibold">📊 Market Insights for {postcode}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Avg Price:</span>{' '}
                          <span className="font-semibold">£{areaStats.average_price?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sales:</span>{' '}
                          <span className="font-semibold">{areaStats.total_sales}</span>
                        </div>
                      </div>
                      {rentRange && (
                        <div className="mt-2 p-2 bg-background rounded border">
                          <p className="text-xs font-semibold mb-1">💰 Suggested Monthly Rent:</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">£{rentRange.min}</Badge>
                            <span className="text-xs">to</span>
                            <Badge variant="secondary">£{rentRange.max}</Badge>
                            <Badge className="ml-auto">£{rentRange.suggested} ideal</Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor="address">Street Address *</Label>
                <Input id="address" name="address" placeholder="e.g., 123 High Street" required />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="city">City *</Label>
                <Input id="city" name="city" placeholder="e.g., Southampton" required />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="property_type">Property Type *</Label>
                <Select 
                  name="property_type" 
                  value={propertyType}
                  onValueChange={setPropertyType}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="terraced">Terraced House</SelectItem>
                    <SelectItem value="semi-detached">Semi-Detached</SelectItem>
                    <SelectItem value="detached">Detached</SelectItem>
                    <SelectItem value="maisonette">Maisonette</SelectItem>
                    <SelectItem value="bungalow">Bungalow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bedrooms">Bedrooms *</Label>
                  <Input 
                    id="bedrooms" 
                    name="bedrooms" 
                    type="number" 
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bathrooms">Bathrooms *</Label>
                  <Input id="bathrooms" name="bathrooms" type="number" required />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="rent" className="flex items-center gap-2">
                  Monthly Rent (£) *
                  {suggestedRent && (
                    <Badge variant="outline" className="ml-auto">
                      AI suggests: £{suggestedRent}
                    </Badge>
                  )}
                </Label>
                <div className="flex gap-2">
                  <Input 
                    id="rent" 
                    name="rent" 
                    type="number" 
                    step="0.01"
                    placeholder={aiEstimateData?.ai_estimate?.monthly_rent ? `AI: £${aiEstimateData.ai_estimate.monthly_rent}` : (suggestedRent ? `Suggested: £${suggestedRent}` : "e.g., 1200")}
                    defaultValue={aiEstimateData?.ai_estimate?.monthly_rent || suggestedRent || undefined}
                    required 
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAIRentEstimate}
                    disabled={aiRentMutation.isPending || !lookupHouseNumber || !lookupPostcode}
                    variant="secondary"
                    className="gap-2 whitespace-nowrap"
                  >
                    {aiRentMutation.isPending ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        AI Estimate
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {showAIEstimate ? '🤖 AI-powered estimation with detailed reasoning' : '💡 Based on recent sales in this area'}
                </p>
                
                {/* AI Estimation Results */}
                {showAIEstimate && aiEstimateData && (
                  <Card className="border-2 border-primary bg-gradient-to-br from-primary/10 to-background mt-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Rent Estimation
                        <Badge className="ml-auto text-lg px-3 py-1">
                          £{aiEstimateData.ai_estimate.monthly_rent}/month
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Confidence: <Badge variant={
                          aiEstimateData.ai_estimate.confidence === 'high' ? 'default' :
                          aiEstimateData.ai_estimate.confidence === 'medium' ? 'secondary' :
                          'outline'
                        }>{aiEstimateData.ai_estimate.confidence}</Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Rent Range */}
                      {aiEstimateData.ai_estimate.rent_range && (
                        <div className="p-3 bg-background rounded-lg border">
                          <p className="text-xs text-muted-foreground mb-2">Recommended Range</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-sm">Min: £{aiEstimateData.ai_estimate.rent_range.minimum}</Badge>
                            <span className="text-xs">→</span>
                            <Badge variant="outline" className="text-sm">Max: £{aiEstimateData.ai_estimate.rent_range.maximum}</Badge>
                          </div>
                        </div>
                      )}
                      
                      {/* AI Reasoning */}
                      <div>
                        <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          AI Reasoning
                        </p>
                        <p className="text-sm text-muted-foreground bg-background p-3 rounded-lg border">
                          {aiEstimateData.ai_estimate.reasoning}
                        </p>
                      </div>
                      
                      {/* Factors Grid */}
                      {aiEstimateData.ai_estimate.factors && (
                        <div className="grid gap-3">
                          {/* Positive Factors */}
                          {aiEstimateData.ai_estimate.factors.positive?.length > 0 && (
                            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                              <p className="text-xs font-semibold text-green-900 dark:text-green-100 mb-2">✅ Positive Factors</p>
                              <ul className="space-y-1">
                                {aiEstimateData.ai_estimate.factors.positive.map((factor: string, idx: number) => (
                                  <li key={idx} className="text-xs text-green-800 dark:text-green-200">• {factor}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Negative Factors */}
                          {aiEstimateData.ai_estimate.factors.negative?.length > 0 && (
                            <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                              <p className="text-xs font-semibold text-red-900 dark:text-red-100 mb-2">⚠️ Negative Factors</p>
                              <ul className="space-y-1">
                                {aiEstimateData.ai_estimate.factors.negative.map((factor: string, idx: number) => (
                                  <li key={idx} className="text-xs text-red-800 dark:text-red-200">• {factor}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Market Comparison */}
                      {aiEstimateData.ai_estimate.market_comparison && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">📊 Market Comparison</p>
                          <p className="text-xs text-blue-800 dark:text-blue-200">
                            {aiEstimateData.ai_estimate.market_comparison}
                          </p>
                        </div>
                      )}
                      
                      {/* Recommendations */}
                      {aiEstimateData.ai_estimate.recommendations?.length > 0 && (
                        <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                          <p className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-2">💡 Recommendations for Agent</p>
                          <ul className="space-y-1">
                            {aiEstimateData.ai_estimate.recommendations.map((rec: string, idx: number) => (
                              <li key={idx} className="text-xs text-purple-800 dark:text-purple-200">• {rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Use This Price Button */}
                      <Button
                        type="button"
                        onClick={() => {
                          const rentInput = document.getElementById('rent') as HTMLInputElement;
                          if (rentInput) {
                            rentInput.value = aiEstimateData.ai_estimate.monthly_rent.toString();
                          }
                          toast({
                            title: 'Price Applied!',
                            description: `Monthly rent set to £${aiEstimateData.ai_estimate.monthly_rent}`,
                          });
                        }}
                        className="w-full gap-2"
                        variant="default"
                      >
                        <TrendingUp className="h-4 w-4" />
                        Use This Price (£{aiEstimateData.ai_estimate.monthly_rent})
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPropertyOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Add Property
              </Button>
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