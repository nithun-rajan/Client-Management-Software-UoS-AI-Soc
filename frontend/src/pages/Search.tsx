import { useState } from 'react';
import { Search as SearchIcon, Building2, Bed, Bath, PoundSterling } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/shared/StatusBadge';
import { usePropertySearch, usePropertySearchCount, SearchFilters } from '@/hooks/useSearch';

export default function Search() {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [hasSearched, setHasSearched] = useState(false);
  
  const { data: properties, isLoading } = usePropertySearch(filters, hasSearched);
  const { data: countData } = usePropertySearchCount(filters, hasSearched);

  const handleFilterChange = (key: keyof SearchFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const handleSearch = () => {
    setHasSearched(true);
  };

  const handleClear = () => {
    setFilters({});
    setHasSearched(false);
  };

  return (
    <div>
      <Header title="Property Search" />
      <div className="p-6 space-y-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Find Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Bedrooms</label>
                <Input 
                  type="number" 
                  placeholder="e.g., 2" 
                  value={filters.bedrooms_min || ''}
                  onChange={(e) => handleFilterChange('bedrooms_min', parseInt(e.target.value) || '')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Bedrooms</label>
                <Input 
                  type="number" 
                  placeholder="e.g., 4" 
                  value={filters.bedrooms_max || ''}
                  onChange={(e) => handleFilterChange('bedrooms_max', parseInt(e.target.value) || '')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rent Range (Min)</label>
                <Input 
                  type="number" 
                  placeholder="£ min" 
                  value={filters.rent_min || ''}
                  onChange={(e) => handleFilterChange('rent_min', parseFloat(e.target.value) || '')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rent Range (Max)</label>
                <Input 
                  type="number" 
                  placeholder="£ max" 
                  value={filters.rent_max || ''}
                  onChange={(e) => handleFilterChange('rent_max', parseFloat(e.target.value) || '')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Postcode</label>
                <Input 
                  placeholder="e.g., SO15" 
                  value={filters.postcode || ''}
                  onChange={(e) => handleFilterChange('postcode', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Property Type</label>
                <Select 
                  value={filters.property_type || ''} 
                  onValueChange={(value) => handleFilterChange('property_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="maisonette">Maisonette</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select 
                  value={filters.status || ''} 
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="let_agreed">Let Agreed</SelectItem>
                    <SelectItem value="let_by">Let By</SelectItem>
                    <SelectItem value="tenanted">Tenanted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSearch} className="flex-1 md:flex-none">
                <SearchIcon className="h-4 w-4 mr-2" />
                Search Properties
              </Button>
              {hasSearched && (
                <Button onClick={handleClear} variant="outline">
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {hasSearched && (
          <>
            {countData && (
              <div className="text-sm text-muted-foreground">
                Found <span className="font-semibold text-foreground">{countData.count}</span> {countData.count === 1 ? 'property' : 'properties'}
              </div>
            )}

            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : properties && properties.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {properties.map((property) => (
                  <Card key={property.id} className="shadow-card hover:shadow-elevated transition-shadow">
                    <CardHeader className="relative">
                      <div className="absolute top-4 right-4 z-10">
                        <StatusBadge status={property.status} />
                      </div>
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <Building2 className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-lg leading-tight">{property.address_line1}</h3>
                          <p className="text-sm text-muted-foreground">
                            {property.city}, {property.postcode}
                          </p>
                        </div>
                        <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded capitalize">
                          {property.property_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Bed className="h-4 w-4" />
                          <span>{property.bedrooms}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Bath className="h-4 w-4" />
                          <span>{property.bathrooms}</span>
                        </div>
                        {property.rent && (
                          <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                            <PoundSterling className="h-4 w-4" />
                            <span>{property.rent.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No properties found</h3>
                <p className="text-muted-foreground">Try adjusting your search filters</p>
              </div>
            )}
          </>
        )}

        {!hasSearched && (
          <div className="text-center py-12">
            <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start your search</h3>
            <p className="text-muted-foreground">Use the filters above to find properties</p>
          </div>
        )}
      </div>
    </div>
  );
}
