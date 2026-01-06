import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Upload, Check, Download, X, Palette, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Logo } from "@/components/Logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DesignRequest {
  id: string;
  ideaDescription: string;
  usage: 'mechanical' | 'decorative' | 'functional' | 'other';
  usageDetails: string;
  status: 'pending' | 'completed';
  adminFile?: {
    url: string;
    name: string;
  };
}

const DesignAssistance = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<DesignRequest | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    ideaDescription: "",
    usage: "mechanical" as 'mechanical' | 'decorative' | 'functional' | 'other',
    usageDetails: "",
    technicalConstraints: "",
    approximateDimensions: "",
    tolerancePrecision: "",
    desiredMaterial: "",
    color: "",
  });
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true' && !!localStorage.getItem('accessToken');
    setIsLoggedIn(loggedIn);
    
    // Redirect to login if not logged in
    if (!loggedIn) {
      toast({
        title: "Login Required",
        description: "Please log in to access Design Assistance",
      });
      navigate("/login");
    }
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ideaDescription || !formData.usageDetails) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Simulate request submission and immediate completion
    const mockRequest: DesignRequest = {
      id: `REQ-${Date.now()}`,
      ideaDescription: formData.ideaDescription,
      usage: formData.usage,
      usageDetails: formData.usageDetails,
      status: 'completed',
      adminFile: {
        url: '/mock-3d-model.stl',
        name: 'custom-design.stl',
      },
    };

    setCurrentRequest(mockRequest);
    setShowCompletionDialog(true);

    toast({
      title: "Request Submitted",
      description: "Your 3D design is being created...",
    });
  };

  const handleApprove = () => {
    if (!currentRequest || !currentRequest.adminFile) return;

    // Download the file
    toast({
      title: "Download Started",
      description: `Downloading ${currentRequest.adminFile.name}`,
    });

    // Redirect to price calculation
    setTimeout(() => {
      navigate("/new-print", {
        state: {
          preloadedFile: currentRequest.adminFile?.url,
          fromDesignAssistance: true,
        }
      });
    }, 500);
  };

  const handleCancel = () => {
    setShowCompletionDialog(false);
    setCurrentRequest(null);
    setFormData({
      ideaDescription: "",
      usage: "mechanical",
      usageDetails: "",
      technicalConstraints: "",
      approximateDimensions: "",
      tolerancePrecision: "",
      desiredMaterial: "",
      color: "",
    });
    setAttachedFiles([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      setAttachedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background overflow-hidden">
      {isLoggedIn && <DashboardSidebar />}
      
      {!isLoggedIn && (
        <header className="fixed top-0 left-0 right-0 border-b border-border glass-effect z-50 animate-slide-up">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <button 
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-xl font-bold text-primary hover:opacity-80 transition-all group"
            >
              <Logo size="sm" textClassName="text-xl" />
            </button>
            <Button variant="outline" onClick={() => navigate("/login")} className="hover-lift">
              Login
            </Button>
          </div>
        </header>
      )}
      
      <main className={`flex-1 p-8 ${!isLoggedIn ? 'pt-24' : ''} overflow-y-auto max-h-screen`}>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="animate-slide-up">
            <h1 className="text-4xl font-bold mb-3 gradient-text">3D Design Assistance</h1>
            <p className="text-muted-foreground text-lg">Describe your idea and we'll create a custom 3D design for you</p>
          </div>

          {/* Design Request Card */}
          <Card className="shadow-xl border-2 border-primary/10 animate-scale-in bg-gradient-to-br from-card to-muted/30">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Palette className="w-6 h-6 text-primary" />
                Describe Your Idea
              </CardTitle>
              <CardDescription className="text-base">
                Tell us about your design idea and we'll create a 3D model for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Design Type Selection */}
                <div className="space-y-3">
                  <Label htmlFor="usage" className="text-base font-semibold">What type of design do you need?</Label>
                  <RadioGroup
                    value={formData.usage}
                    onValueChange={(value) => setFormData({ ...formData, usage: value as any })}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-primary/20 hover:bg-primary/5 cursor-pointer transition-all">
                      <RadioGroupItem value="mechanical" id="mechanical" />
                      <Label htmlFor="mechanical" className="cursor-pointer font-medium">Mechanical Part</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-primary/20 hover:bg-primary/5 cursor-pointer transition-all">
                      <RadioGroupItem value="decorative" id="decorative" />
                      <Label htmlFor="decorative" className="cursor-pointer font-medium">Decorative Piece</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-primary/20 hover:bg-primary/5 cursor-pointer transition-all">
                      <RadioGroupItem value="functional" id="functional" />
                      <Label htmlFor="functional" className="cursor-pointer font-medium">Functional Object</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-primary/20 hover:bg-primary/5 cursor-pointer transition-all">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other" className="cursor-pointer font-medium">Other</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Attached Files */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">📎 Attached Files (Optional but Highly Recommended)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4 text-sm text-muted-foreground">
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="font-semibold text-primary mb-1">📷 Sketches</p>
                      <p>Photo, PDF</p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="font-semibold text-primary mb-1">🎯 Existing 3D File</p>
                      <p>STL, STEP, OBJ</p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="font-semibold text-primary mb-1">✨ Inspiration</p>
                      <p>Images</p>
                    </div>
                  </div>

                  {/* Drag & Drop Zone */}
                  <div
                    className={`border-3 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer group ${
                      isDragging
                        ? 'border-primary bg-primary/10 scale-[1.02]'
                        : 'border-primary/30 hover:border-primary hover:bg-primary/5'
                    }`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      id="attached-files"
                      className="hidden"
                      multiple
                      accept="image/*,.pdf,.dwg,.dxf,.step,.stl,.obj"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="attached-files" className="cursor-pointer block">
                      <div className={`w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg transition-all ${
                        isDragging ? 'scale-125 rotate-12' : 'group-hover:scale-110 group-hover:rotate-6'
                      }`}>
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                      <p className={`font-bold text-lg mb-2 transition-colors ${
                        isDragging ? 'text-primary' : 'group-hover:text-primary'
                      }`}>
                        {isDragging ? 'Drop your files here' : 'Click or drag & drop files'}
                      </p>
                      <p className="text-muted-foreground text-sm">Photos, PDF, 3D files (STL, STEP, OBJ) up to 50MB</p>
                    </label>
                  </div>

                  {/* Attached Files List */}
                  {attachedFiles.length > 0 && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3">
                        ✓ {attachedFiles.length} file(s) attached
                      </p>
                      <ul className="space-y-2">
                        {attachedFiles.map((file, index) => (
                          <li key={index} className="flex items-center justify-between p-2 bg-white dark:bg-background rounded border border-green-200 dark:border-green-800/50">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FileText className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              <span className="text-sm text-muted-foreground truncate">{file.name}</span>
                              <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="ml-2 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors flex-shrink-0"
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Idea Description */}
                <div className="space-y-2">
                  <Label htmlFor="ideaDescription" className="text-base font-semibold">Describe Your Idea *</Label>
                  <Textarea
                    id="ideaDescription"
                    placeholder="Example: I need a custom phone stand that can hold my phone at a 45-degree angle. It should be stable and have a slot for the charging cable..."
                    rows={6}
                    value={formData.ideaDescription}
                    onChange={(e) => setFormData({ ...formData, ideaDescription: e.target.value })}
                    required
                    className="resize-none border-2 focus:border-primary"
                  />
                  <p className="text-sm text-muted-foreground">
                    Be specific about dimensions, purpose, and any special requirements
                  </p>
                </div>

                {/* Additional Details */}
                <div className="space-y-2">
                  <Label htmlFor="usageDetails" className="text-base font-semibold">Additional Details *</Label>
                  <Textarea
                    id="usageDetails"
                    placeholder="How will you use this? Any specific measurements, materials preferences, or design constraints?"
                    rows={4}
                    value={formData.usageDetails}
                    onChange={(e) => setFormData({ ...formData, usageDetails: e.target.value })}
                    required
                    className="resize-none border-2 focus:border-primary"
                  />
                </div>

                {/* Technical Constraints */}
                <div className="space-y-2">
                  <Label htmlFor="technicalConstraints" className="text-base font-semibold">Technical Constraints</Label>
                  <Textarea
                    id="technicalConstraints"
                    placeholder="Any specific technical requirements? E.g., Heat resistance, water-tight, load-bearing capacity, moving parts, assembly requirements..."
                    rows={3}
                    value={formData.technicalConstraints}
                    onChange={(e) => setFormData({ ...formData, technicalConstraints: e.target.value })}
                    className="resize-none border-2 focus:border-primary"
                  />
                </div>

                {/* Grid for Material and Dimensions */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Approximate Dimensions */}
                  <div className="space-y-2">
                    <Label htmlFor="approximateDimensions" className="text-base font-semibold">Approximate Dimensions</Label>
                    <Input
                      id="approximateDimensions"
                      placeholder="E.g., 100mm x 50mm x 30mm (L x W x H)"
                      value={formData.approximateDimensions}
                      onChange={(e) => setFormData({ ...formData, approximateDimensions: e.target.value })}
                      className="border-2 focus:border-primary"
                    />
                  </div>

                  {/* Tolerance/Precision */}
                  <div className="space-y-2">
                    <Label htmlFor="tolerancePrecision" className="text-base font-semibold">Tolerance/Precision</Label>
                    <Input
                      id="tolerancePrecision"
                      placeholder="E.g., ±0.5mm, ±1mm, tight tolerance required..."
                      value={formData.tolerancePrecision}
                      onChange={(e) => setFormData({ ...formData, tolerancePrecision: e.target.value })}
                      className="border-2 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Grid for Material and Color */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Desired Material */}
                  <div className="space-y-2">
                    <Label htmlFor="desiredMaterial" className="text-base font-semibold">Desired Material</Label>
                    <select
                      id="desiredMaterial"
                      value={formData.desiredMaterial}
                      onChange={(e) => setFormData({ ...formData, desiredMaterial: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-primary/30 rounded-lg focus:border-primary focus:outline-none bg-background"
                    >
                      <option value="">Select a material...</option>
                      <option value="pla">PLA</option>
                      <option value="abs">ABS</option>
                      <option value="petg">PETG</option>
                      <option value="tpu">TPU (Flexible)</option>
                      <option value="resin">Resin</option>
                      <option value="unsure">Not sure / Recommend best option</option>
                    </select>
                  </div>

                  {/* Color */}
                  <div className="space-y-2">
                    <Label htmlFor="color" className="text-base font-semibold">Color (If Known)</Label>
                    <Input
                      id="color"
                      placeholder="E.g., Black, White, Red, Custom color code..."
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="border-2 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full h-12 text-lg font-semibold shadow-lg hover-lift" size="lg">
                  <Palette className="w-5 h-5 mr-2" />
                  Submit Design 
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="max-w-md animate-scale-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Check className="w-6 h-6 text-green-500" />
              3D Design Created!
            </DialogTitle>
          </DialogHeader>

          <div className="py-6 text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center shadow-lg">
              <Check className="w-10 h-10 text-green-600 dark:text-green-500" />
            </div>
            <p className="text-lg font-semibold">
              Your custom 3D design has been created and is ready for review!
            </p>
            <p className="text-sm text-muted-foreground">
              File: <span className="font-mono font-bold">{currentRequest?.adminFile?.name}</span>
            </p>
          </div>

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1 h-10"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              className="flex-1 h-10 shadow-lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Approve & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DesignAssistance;
