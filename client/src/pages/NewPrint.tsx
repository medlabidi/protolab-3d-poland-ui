import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Calculator, Send, Box } from "lucide-react";
import { toast } from "sonner";

const NewPrint = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      toast.success("File uploaded successfully!");
    }
  };

  const calculatePrice = () => {
    // Check if user is logged in
    if (!isLoggedIn) {
      toast.info("Please login to get price estimate");
      navigate("/login");
      return;
    }
    
    // Simulate price calculation
    const price = Math.floor(Math.random() * 200) + 50;
    setEstimatedPrice(price);
    toast.success("Price calculated!");
  };

  const submitOrder = () => {
    toast.success("Order submitted successfully!");
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      {isLoggedIn && <DashboardSidebar />}
      
      {!isLoggedIn && (
        <header className="fixed top-0 left-0 right-0 border-b border-border glass-effect z-50 animate-slide-up">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <button 
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-xl font-bold text-primary hover:opacity-80 transition-all group"
            >
              <Box className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
              <span className="gradient-text">ProtoLab</span>
            </button>
            <Button variant="outline" onClick={() => navigate("/login")} className="hover-lift">
              Login
            </Button>
          </div>
        </header>
      )}
      
      <main className={`flex-1 p-8 ${!isLoggedIn ? 'pt-24' : ''}`}>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="animate-slide-up">
            <h1 className="text-4xl font-bold mb-3 gradient-text">New Print Request</h1>
            <p className="text-muted-foreground text-lg">Upload your 3D model and configure print parameters</p>
          </div>

          {/* File Upload */}
          <Card className="shadow-xl border-2 border-primary/10 animate-scale-in bg-gradient-to-br from-white to-gray-50/30">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Upload className="w-6 h-6 text-primary" />
                Upload 3D Model
              </CardTitle>
              <CardDescription className="text-base">Supported formats: STL, OBJ, STEP (max 50MB)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-3 border-dashed border-primary/30 rounded-2xl p-12 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group hover-lift bg-gradient-to-br from-primary/5 to-purple-500/5">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".stl,.obj,.step"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Upload className="w-10 h-10 text-white" />
                  </div>
                  {file ? (
                    <div className="animate-scale-in">
                      <p className="font-bold text-xl text-primary mb-2">{file.name}</p>
                      <p className="text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">Click to upload or drag and drop</p>
                      <p className="text-muted-foreground">STL, OBJ, or STEP files</p>
                    </div>
                  )}
                </label>
              </div>
              
              {file && (
                <div className="mt-6 p-6 bg-gradient-to-br from-muted/50 to-background rounded-2xl border-2 border-primary/10 animate-slide-up">
                  <p className="text-sm font-bold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                    3D Preview
                  </p>
                  <div className="aspect-square bg-gradient-to-br from-background to-muted rounded-xl border-2 border-primary/10 flex items-center justify-center shadow-inner">
                    <p className="text-muted-foreground">3D model preview placeholder</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card className="shadow-xl border-2 border-primary/10 animate-scale-in bg-gradient-to-br from-white to-gray-50/30" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Calculator className="w-6 h-6 text-primary" />
                Print Configuration
              </CardTitle>
              <CardDescription className="text-base">Select your preferred print settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="material">Material</Label>
                  <Select>
                    <SelectTrigger id="material">
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pla">PLA - Standard</SelectItem>
                      <SelectItem value="abs">ABS - Durable</SelectItem>
                      <SelectItem value="petg">PETG - Strong</SelectItem>
                      <SelectItem value="tpu">TPU - Flexible</SelectItem>
                      <SelectItem value="nylon">Nylon - Industrial</SelectItem>
                      <SelectItem value="resin">Resin - High Detail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Select>
                    <SelectTrigger id="color">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="white">White</SelectItem>
                      <SelectItem value="black">Black</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="yellow">Yellow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quality">Quality</Label>
                  <Select>
                    <SelectTrigger id="quality">
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft - Fast</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="high">High Quality</SelectItem>
                      <SelectItem value="ultra">Ultra - Finest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" type="number" min="1" defaultValue="1" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of the Part</Label>
                <Textarea
                  id="purpose"
                  placeholder="Describe what this part will be used for..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="advanced"
                  checked={showAdvanced}
                  onCheckedChange={(checked) => setShowAdvanced(checked as boolean)}
                />
                <Label htmlFor="advanced" className="cursor-pointer">
                  Show advanced settings
                </Label>
              </div>

              {showAdvanced && (
                <div className="grid md:grid-cols-2 gap-6 p-4 bg-muted rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="layer-height">Layer Height (mm)</Label>
                    <Select>
                      <SelectTrigger id="layer-height">
                        <SelectValue placeholder="Select layer height" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.1">0.1mm - Ultra Fine</SelectItem>
                        <SelectItem value="0.2">0.2mm - Standard</SelectItem>
                        <SelectItem value="0.3">0.3mm - Fast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="infill">Infill %</Label>
                    <Select>
                      <SelectTrigger id="infill">
                        <SelectValue placeholder="Select infill" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10% - Light</SelectItem>
                        <SelectItem value="20">20% - Standard</SelectItem>
                        <SelectItem value="50">50% - Strong</SelectItem>
                        <SelectItem value="100">100% - Solid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pattern">Infill Pattern</Label>
                    <Select>
                      <SelectTrigger id="pattern">
                        <SelectValue placeholder="Select pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="honeycomb">Honeycomb</SelectItem>
                        <SelectItem value="triangles">Triangles</SelectItem>
                        <SelectItem value="gyroid">Gyroid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supports">Support Structures</Label>
                    <Select>
                      <SelectTrigger id="supports">
                        <SelectValue placeholder="Select supports" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="tree">Tree Supports</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Price Estimate */}
          <Card className="shadow-xl border-2 border-primary/10 animate-scale-in bg-gradient-to-br from-white to-gray-50/30" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Calculator className="w-6 h-6 text-primary" />
                Price Estimate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={calculatePrice} className="w-full h-12 hover-lift shadow-lg group relative overflow-hidden" variant="default">
                <span className="relative z-10 flex items-center">
                  <Calculator className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Calculate Price
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Button>

              {estimatedPrice && (
                <div className="p-8 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl border-2 border-primary/30 shadow-lg animate-scale-in">
                  <p className="text-sm text-muted-foreground mb-2 font-semibold">Estimated Price</p>
                  <p className="text-5xl font-bold gradient-text mb-3">{estimatedPrice}.00 PLN</p>
                  <p className="text-sm text-muted-foreground">
                    + shipping cost (calculated at checkout)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping */}
          <Card className="shadow-xl border-2 border-primary/10 animate-scale-in bg-gradient-to-br from-white to-gray-50/30" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Send className="w-6 h-6 text-primary" />
                Shipping Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3 p-5 border-2 border-primary/20 rounded-xl cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all hover-lift group">
                <input type="radio" name="shipping" id="pickup" defaultChecked className="w-5 h-5" />
                <Label htmlFor="pickup" className="cursor-pointer flex-1">
                  <p className="font-bold text-lg group-hover:text-primary transition-colors">Local Pickup</p>
                  <p className="text-sm text-muted-foreground">Free - Collect from our studio</p>
                </Label>
                <div className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-bold">FREE</div>
              </div>

              <div className="flex items-center space-x-3 p-5 border-2 border-border rounded-xl cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all hover-lift group">
                <input type="radio" name="shipping" id="inpost" className="w-5 h-5" />
                <Label htmlFor="inpost" className="cursor-pointer flex-1">
                  <p className="font-bold text-lg group-hover:text-primary transition-colors">InPost Locker</p>
                  <p className="text-sm text-muted-foreground">From 12 PLN</p>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-5 border-2 border-border rounded-xl cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all hover-lift group">
                <input type="radio" name="shipping" id="courier" className="w-5 h-5" />
                <Label htmlFor="courier" className="cursor-pointer flex-1">
                  <p className="font-bold text-lg group-hover:text-primary transition-colors">Courier Delivery</p>
                  <p className="text-sm text-muted-foreground">From 25 PLN</p>
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button onClick={submitOrder} size="lg" className="w-full h-14 text-lg hover-lift shadow-xl group relative overflow-hidden animate-scale-in" style={{ animationDelay: '0.4s' }}>
            <span className="relative z-10 flex items-center">
              <Send className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
              Submit Print Job
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default NewPrint;
