import { useState } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Calculator, Send } from "lucide-react";
import { toast } from "sonner";

const NewPrint = () => {
  const [file, setFile] = useState<File | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      toast.success("File uploaded successfully!");
    }
  };

  const calculatePrice = () => {
    // Simulate price calculation
    const price = Math.floor(Math.random() * 200) + 50;
    setEstimatedPrice(price);
    toast.success("Price calculated!");
  };

  const submitOrder = () => {
    toast.success("Order submitted successfully!");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">New Print Request</h1>
            <p className="text-muted-foreground">Upload your 3D model and configure print parameters</p>
          </div>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload 3D Model</CardTitle>
              <CardDescription>Supported formats: STL, OBJ, STEP (max 50MB)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".stl,.obj,.step"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  {file ? (
                    <div>
                      <p className="font-medium text-primary">{file.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">Click to upload or drag and drop</p>
                      <p className="text-sm text-muted-foreground mt-1">STL, OBJ, or STEP files</p>
                    </div>
                  )}
                </label>
              </div>
              
              {file && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">3D Preview</p>
                  <div className="aspect-square bg-background rounded border flex items-center justify-center">
                    <p className="text-muted-foreground">3D model preview placeholder</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Print Configuration</CardTitle>
              <CardDescription>Select your preferred print settings</CardDescription>
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
          <Card>
            <CardHeader>
              <CardTitle>Price Estimate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={calculatePrice} className="w-full" variant="outline">
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Price
              </Button>

              {estimatedPrice && (
                <div className="p-6 bg-primary/5 rounded-lg border-2 border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">Estimated Price</p>
                  <p className="text-3xl font-bold text-primary">{estimatedPrice}.00 PLN</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    + shipping cost (calculated at checkout)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                <input type="radio" name="shipping" id="pickup" defaultChecked />
                <Label htmlFor="pickup" className="cursor-pointer flex-1">
                  <p className="font-medium">Local Pickup</p>
                  <p className="text-sm text-muted-foreground">Free - Collect from our studio</p>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                <input type="radio" name="shipping" id="inpost" />
                <Label htmlFor="inpost" className="cursor-pointer flex-1">
                  <p className="font-medium">InPost Locker</p>
                  <p className="text-sm text-muted-foreground">From 12 PLN</p>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                <input type="radio" name="shipping" id="courier" />
                <Label htmlFor="courier" className="cursor-pointer flex-1">
                  <p className="font-medium">Courier Delivery</p>
                  <p className="text-sm text-muted-foreground">From 25 PLN</p>
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button onClick={submitOrder} size="lg" className="w-full">
            <Send className="mr-2 h-5 w-5" />
            Submit Print Job
          </Button>
        </div>
      </main>
    </div>
  );
};

export default NewPrint;
