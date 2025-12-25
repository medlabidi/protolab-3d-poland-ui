import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Upload, Check, Download, X, Palette } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Logo } from "@/components/Logo";

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
  });

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
    });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/10 to-background overflow-hidden">
      <DashboardSidebar />

      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="max-w-7xl space-y-8">
          {/* Header */}
          <div className="animate-slide-up">
            <h1 className="text-3xl font-bold mb-2 gradient-text">
              3D Design Assistance
            </h1>
            <p className="text-muted-foreground">
              Describe your idea and we'll create a custom 3D design for you
            </p>
          </div>

          {/* Request Form */}
          <Card className="shadow-xl border-2 border-primary/10 animate-scale-in">
            <CardHeader>
              <CardTitle>Describe Your Idea</CardTitle>
              <CardDescription>
                Tell us about your design idea and we'll create a 3D model for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="usage">What type of design do you need?</Label>
                  <RadioGroup
                    value={formData.usage}
                    onValueChange={(value) => setFormData({ ...formData, usage: value as any })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mechanical" id="mechanical" />
                      <Label htmlFor="mechanical" className="cursor-pointer">Mechanical Part</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="decorative" id="decorative" />
                      <Label htmlFor="decorative" className="cursor-pointer">Decorative Piece</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="functional" id="functional" />
                      <Label htmlFor="functional" className="cursor-pointer">Functional Object</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other" className="cursor-pointer">Other</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ideaDescription">Describe Your Idea *</Label>
                  <Textarea
                    id="ideaDescription"
                    placeholder="Example: I need a custom phone stand that can hold my phone at a 45-degree angle. It should be stable and have a slot for the charging cable..."
                    rows={6}
                    value={formData.ideaDescription}
                    onChange={(e) => setFormData({ ...formData, ideaDescription: e.target.value })}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Be specific about dimensions, purpose, and any special requirements
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usageDetails">Additional Details *</Label>
                  <Textarea
                    id="usageDetails"
                    placeholder="How will you use this? Any specific measurements, materials preferences, or design constraints?"
                    rows={4}
                    value={formData.usageDetails}
                    onChange={(e) => setFormData({ ...formData, usageDetails: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" size="lg">
                  <Palette className="w-4 h-4 mr-2" />
                  Submit Design Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Check className="w-6 h-6 text-green-500" />
              3D Design Created!
            </DialogTitle>
          </DialogHeader>

          <div className="py-6 text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <Check className="w-10 h-10 text-green-600 dark:text-green-500" />
            </div>
            <p className="text-lg">
              Your custom 3D design has been created and is ready for review!
            </p>
            <p className="text-sm text-muted-foreground">
              File: <span className="font-mono">{currentRequest?.adminFile?.name}</span>
            </p>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              className="flex-1"
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
