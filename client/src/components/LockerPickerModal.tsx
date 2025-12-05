import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Locker {
  name: string;
  address: {
    line1: string;
    line2: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  opening_hours: string;
  location_description: string;
}

interface LockerPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelectLocker: (locker: { id: string; name: string; address: string }) => void;
}

// Fallback mock data in case API fails
const MOCK_LOCKERS: Locker[] = [
  {
    name: "KRA01M",
    address: { line1: "Galeria Krakowska", line2: "ul. Pawia 5, 31-154 Kraków" },
    location: { latitude: 50.0682, longitude: 19.9472 },
    opening_hours: "24/7",
    location_description: "Shopping center, near main train station"
  },
  {
    name: "KRA02M",
    address: { line1: "Rynek Główny 1", line2: "31-042 Kraków" },
    location: { latitude: 50.0619, longitude: 19.9368 },
    opening_hours: "24/7",
    location_description: "Main Market Square, city center"
  },
  {
    name: "KRA03M",
    address: { line1: "ul. Floriańska 10", line2: "31-021 Kraków" },
    location: { latitude: 50.0640, longitude: 19.9380 },
    opening_hours: "24/7",
    location_description: "Floriańska Street, near Barbican"
  },
  {
    name: "KRA04M",
    address: { line1: "ul. Długa 72", line2: "31-146 Kraków" },
    location: { latitude: 50.0700, longitude: 19.9450 },
    opening_hours: "24/7",
    location_description: "Długa Street, residential area"
  },
  {
    name: "KRA05M",
    address: { line1: "Galeria Kazimierz", line2: "ul. Podgórska 34, 31-548 Kraków" },
    location: { latitude: 50.0520, longitude: 19.9530 },
    opening_hours: "24/7",
    location_description: "Kazimierz district, shopping center"
  },
  {
    name: "KRA06M",
    address: { line1: "ul. Wielicka 259", line2: "30-663 Kraków" },
    location: { latitude: 50.0270, longitude: 19.9890 },
    opening_hours: "24/7",
    location_description: "Wielicka Street, near M1 shopping center"
  },
  {
    name: "KRA07M",
    address: { line1: "ul. Kalwaryjska 69", line2: "30-504 Kraków" },
    location: { latitude: 50.0410, longitude: 19.9560 },
    opening_hours: "24/7",
    location_description: "Kalwaryjska Street, Podgórze district"
  },
  {
    name: "KRA08M",
    address: { line1: "Bonarka City Center", line2: "ul. Kamieńskiego 11, 30-644 Kraków" },
    location: { latitude: 50.0350, longitude: 19.9600 },
    opening_hours: "24/7",
    location_description: "Large shopping mall, south Krakow"
  },
  {
    name: "KRA09M",
    address: { line1: "ul. Lea 118", line2: "30-133 Kraków" },
    location: { latitude: 50.0800, longitude: 19.9200 },
    opening_hours: "24/7",
    location_description: "Krowodrza district, residential"
  },
  {
    name: "KRA10M",
    address: { line1: "ul. Rakowicka 20", line2: "31-510 Kraków" },
    location: { latitude: 50.0680, longitude: 19.9520 },
    opening_hours: "24/7",
    location_description: "Near AGH University"
  },
  {
    name: "KRA11M",
    address: { line1: "ul. Opolska 14", line2: "31-323 Kraków" },
    location: { latitude: 50.0790, longitude: 19.9680 },
    opening_hours: "24/7",
    location_description: "Nowa Huta district"
  },
  {
    name: "KRA12M",
    address: { line1: "ul. Dietla 60", line2: "31-054 Kraków" },
    location: { latitude: 50.0580, longitude: 19.9480 },
    opening_hours: "24/7",
    location_description: "Dietla Street, near Vistula River"
  },
  {
    name: "KRA13M",
    address: { line1: "ul. Grzegórzecka 67", line2: "31-559 Kraków" },
    location: { latitude: 50.0650, longitude: 19.9700 },
    opening_hours: "24/7",
    location_description: "Grzegórzki district"
  },
  {
    name: "KRA14M",
    address: { line1: "ul. Mogilska 41", line2: "31-545 Kraków" },
    location: { latitude: 50.0710, longitude: 19.9850 },
    opening_hours: "24/7",
    location_description: "Mogilska Street, business area"
  },
  {
    name: "KRA15M",
    address: { line1: "ul. Zakopiańska 62", line2: "30-418 Kraków" },
    location: { latitude: 50.0200, longitude: 19.9100 },
    opening_hours: "24/7",
    location_description: "Zakopiańska Street, south-west"
  }
];

export const LockerPickerModal = ({ open, onClose, onSelectLocker }: LockerPickerModalProps) => {
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [filteredLockers, setFilteredLockers] = useState<Locker[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedLockerId, setSelectedLockerId] = useState<string | null>(null);
  const [useMapSearch, setUseMapSearch] = useState(false);
  const [apiFailure, setApiFailure] = useState(false);

  useEffect(() => {
    if (open && lockers.length === 0) {
      fetchLockers();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredLockers(lockers.slice(0, 20));
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = lockers.filter(
        (locker) =>
          locker.name.toLowerCase().includes(query) ||
          locker.address.line1.toLowerCase().includes(query) ||
          locker.address.line2.toLowerCase().includes(query)
      );
      setFilteredLockers(filtered.slice(0, 20));
    }
  }, [searchQuery, lockers]);

  const fetchLockers = async () => {
    setLoading(true);
    setApiFailure(false);
    try {
      // Fetch Krakow lockers
      const response = await fetch(
        "https://api-pl.easypack24.net/v4/points?type=parcel_locker&city=Krakow",
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        console.warn(`API returned status ${response.status}, switching to map search`);
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("InPost API Response:", data); // Debug log
      
      // Handle different possible response formats
      let lockerData = [];
      if (Array.isArray(data)) {
        lockerData = data;
      } else if (data.items && Array.isArray(data.items)) {
        lockerData = data.items;
      } else if (data.data && Array.isArray(data.data)) {
        lockerData = data.data;
      }
      
      console.log("Parsed locker data:", lockerData.length, "lockers"); // Debug log
      
      if (lockerData.length > 0) {
        setLockers(lockerData);
        setFilteredLockers(lockerData.slice(0, 20));
        setApiFailure(false);
        setUseMapSearch(false);
        toast.success(`Loaded ${lockerData.length} InPost lockers`);
      } else {
        // Switch to map search mode
        console.warn("API returned empty data, switching to map search");
        setApiFailure(true);
        setUseMapSearch(true);
        setLockers([]);
        setFilteredLockers([]);
        toast.info("Select a locker from the map to load its details");
      }
    } catch (error) {
      console.error("InPost API Error:", error);
      // Switch to map search mode
      setApiFailure(true);
      setUseMapSearch(true);
      setLockers([]);
      setFilteredLockers([]);
      toast.warning("API unavailable - Please select a locker from the map");
    } finally {
      setLoading(false);
    }
  };

  const fetchLockerDetails = async (lockerName: string) => {
    try {
      const response = await fetch(
        `https://api-pl.easypack24.net/v4/points/${lockerName}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const locker = await response.json();
      console.log("Locker details fetched:", locker);
      return locker;
    } catch (error) {
      console.error("Failed to fetch locker details:", error);
      return null;
    }
  };

  const handleMapLockerSelect = async (lockerName: string) => {
    toast.info(`Fetching details for ${lockerName}...`);
    const locker = await fetchLockerDetails(lockerName);
    
    if (locker) {
      onSelectLocker({
        id: locker.name,
        name: locker.name,
        address: `${locker.address.line1}, ${locker.address.line2}`,
      });
      toast.success(`Locker ${lockerName} selected!`);
      onClose();
    } else {
      toast.error(`Could not load details for ${lockerName}. Please try another locker.`);
    }
  };

  const handleSelectLocker = (locker: Locker) => {
    onSelectLocker({
      id: locker.name,
      name: locker.name,
      address: `${locker.address.line1}, ${locker.address.line2}`,
    });
    onClose();
  };

  const handleLockerClick = (locker: Locker) => {
    setSelectedLockerId(locker.name);
  };

  // Create markers for the map
  const createMapMarkers = () => {
    if (filteredLockers.length === 0) return '';
    
    return filteredLockers.map((locker, index) => {
      const lat = locker.location.latitude;
      const lon = locker.location.longitude;
      return `&marker=${lat},${lon}`;
    }).slice(0, 50).join(''); // Limit to 50 markers to avoid URL length issues
  };

  const getMapCenter = () => {
    if (filteredLockers.length > 0) {
      const avgLat = filteredLockers.reduce((sum, l) => sum + l.location.latitude, 0) / filteredLockers.length;
      const avgLon = filteredLockers.reduce((sum, l) => sum + l.location.longitude, 0) / filteredLockers.length;
      return { lat: avgLat, lon: avgLon };
    }
    return { lat: 50.0619, lon: 19.9368 }; // Default Krakow center
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            Select InPost Locker
          </DialogTitle>
          <DialogDescription>
            Choose a convenient parcel locker near you in Krakow
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by locker name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Map Section */}
          <div className="flex-1 rounded-lg overflow-hidden border-2 border-border bg-muted/20 flex flex-col">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : useMapSearch ? (
              <>
                <div className="flex-1 relative">
                  <iframe
                    src="https://www.google.com/maps/search/inpost+paczkomat+krakow/@50.0619,19.9368,13z?output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    title="InPost Lockers Map Search"
                  />
                </div>
                <div className="p-4 bg-background border-t space-y-3">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-3 rounded">
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</span>
                      <div>
                        <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">API Unavailable - Map Search Mode</p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                          1. Find a Paczkomat on the map above<br/>
                          2. Note its code (e.g., "KRA01M")<br/>
                          3. Enter it below to load details
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter locker code (e.g., KRA01M)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchQuery.trim()) {
                          handleMapLockerSelect(searchQuery.trim());
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => {
                        if (searchQuery.trim()) {
                          handleMapLockerSelect(searchQuery.trim());
                        } else {
                          toast.error("Please enter a locker code");
                        }
                      }}
                      disabled={!searchQuery.trim()}
                    >
                      Load Details
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={fetchLockers}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      🔄 Retry API
                    </Button>
                    <a 
                      href="https://www.google.com/maps/search/inpost+paczkomat+krakow/@50.0619,19.9368,13z"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        🗺️ Open in New Tab
                      </Button>
                    </a>
                  </div>
                </div>
              </>
            ) : filteredLockers.length > 0 ? (
              <>
                <div className="flex-1 relative">
                  <div className="absolute inset-0 bg-muted/10 backdrop-blur-sm flex items-center justify-center z-10 pointer-events-none">
                    <div className="bg-background/95 px-4 py-2 rounded-lg shadow-lg border-2 border-primary/20">
                      <p className="text-sm font-semibold text-primary">
                        📍 {filteredLockers.length} lockers shown on list
                      </p>
                    </div>
                  </div>
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=19.8,49.95,20.1,50.15&layer=mapnik`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    title="Krakow Map"
                  />
                </div>
                <div className="p-3 bg-background border-t space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Select a locker from the list to see details
                    </span>
                    <a 
                      href={`https://www.google.com/maps/search/inpost+paczkomat+krakow/@${getMapCenter().lat},${getMapCenter().lon},13z`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      🗺️ View in Google Maps
                    </a>
                  </div>
                  {selectedLockerId && filteredLockers.find(l => l.name === selectedLockerId) && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${filteredLockers.find(l => l.name === selectedLockerId)?.location.latitude},${filteredLockers.find(l => l.name === selectedLockerId)?.location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 bg-primary/10 rounded text-xs hover:bg-primary/20 transition-colors"
                    >
                      <p className="font-semibold text-primary">Selected: {selectedLockerId}</p>
                      <p className="text-muted-foreground">Click to view exact location on Google Maps →</p>
                    </a>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                No lockers to display on map
              </div>
            )}
          </div>

          {/* Locker List Section */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading InPost lockers...</p>
            </div>
          ) : useMapSearch ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center px-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-lg mb-2">Map Search Mode Active</p>
                <p className="text-sm text-muted-foreground mb-4">
                  InPost API is currently unavailable.<br/>
                  Use the map to find a locker and enter its code.
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left space-y-2">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-300">📝 How to use:</p>
                <ol className="text-xs text-blue-800 dark:text-blue-400 space-y-1 list-decimal list-inside">
                  <li>Look at the map for InPost Paczkomat locations</li>
                  <li>Click on a marker to see the locker code</li>
                  <li>Enter the code (e.g., KRA01M) in the input field</li>
                  <li>Click "Load Details" to fetch locker information</li>
                </ol>
              </div>
              <p className="text-xs text-muted-foreground">
                Common codes: KRA01M, KRA02M, KRA03M, etc.
              </p>
            </div>
          ) : filteredLockers.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <p className="text-muted-foreground">
                {searchQuery ? "No lockers found matching your search" : "No lockers available"}
              </p>
              {!searchQuery && lockers.length === 0 && !apiFailure && (
                <Button 
                  onClick={fetchLockers}
                  variant="outline"
                  size="sm"
                >
                  🔄 Retry Loading Lockers
                </Button>
              )}
            </div>
          ) : (
            filteredLockers.map((locker) => (
              <div
                key={locker.name}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedLockerId === locker.name
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary hover:bg-primary/5'
                }`}
                onClick={() => handleLockerClick(locker)}
                onDoubleClick={() => handleSelectLocker(locker)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-lg">{locker.name}</p>
                      {selectedLockerId === locker.name && (
                        <span className="text-xs bg-primary text-white px-2 py-0.5 rounded">Selected</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      📍 {locker.address.line1}
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      {locker.address.line2}
                    </p>
                    {locker.location_description && (
                      <p className="text-xs text-muted-foreground italic">
                        ℹ️ {locker.location_description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button 
                      size="sm" 
                      variant={selectedLockerId === locker.name ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectLocker(locker);
                      }}
                    >
                      Confirm
                    </Button>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${locker.location.latitude},${locker.location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-center text-primary hover:underline"
                    >
                      View on Map
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
