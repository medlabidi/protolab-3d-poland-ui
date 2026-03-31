import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ModelViewerUrl } from "@/components/ModelViewer/ModelViewerUrl";
import {
  Wand2,
  Loader2,
  Download,
  ShoppingCart,
  Sparkles,
  RotateCcw,
  History,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/config/api";

interface GenerationJob {
  id: string;
  prompt: string;
  style: string | null;
  face_limit: number | null;
  status: "pending" | "generating" | "processing" | "ready" | "failed";
  file_url: string | null;
  file_name: string | null;
  error_message: string | null;
  created_at: string;
}

const DETAIL_LABELS: Record<number, string> = {
  10000: "Low",
  50000: "Medium",
  100000: "High",
};

const TextTo3D = () => {
  const navigate = useNavigate();

  // Form state
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("none");
  const [detailLevel, setDetailLevel] = useState([50000]);

  // Generation state
  const [currentJob, setCurrentJob] = useState<GenerationJob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // History state
  const [history, setHistory] = useState<GenerationJob[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
    };
  }, []);

  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/generate-3d`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data.generations || []);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const startPolling = (jobId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch(`${API_URL}/generate-3d/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to check status");

        const data = await response.json();
        const job = data.job;
        setCurrentJob(job);

        if (job.status === "ready") {
          stopAllIntervals();
          setIsGenerating(false);
          setProgress(100);
          toast.success("3D model generated successfully!");
          fetchHistory();
        } else if (job.status === "failed") {
          stopAllIntervals();
          setIsGenerating(false);
          toast.error(job.error_message || "Generation failed");
          fetchHistory();
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    }, 4000);
  };

  const stopAllIntervals = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setIsGenerating(true);
    setProgress(5);
    setCurrentJob(null);
    setElapsedSeconds(0);

    // Start elapsed timer
    elapsedIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Simulated progress
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          if (progressIntervalRef.current)
            clearInterval(progressIntervalRef.current);
          return 90;
        }
        return prev + Math.random() * 5;
      });
    }, 2000);

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_URL}/generate-3d`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: style !== "none" ? style : undefined,
          face_limit: detailLevel[0],
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to start generation");
      }

      const data = await response.json();
      setCurrentJob(data.job);
      setProgress(10);
      startPolling(data.job.id);
    } catch (err: any) {
      stopAllIntervals();
      setIsGenerating(false);
      toast.error(err.message);
    }
  };

  const handleOrderPrint = async () => {
    if (!currentJob?.id) return;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${API_URL}/generate-3d/${currentJob.id}/order`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            material: "PLA",
            color: "white",
            quantity: 1,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to create order");

      const data = await response.json();
      toast.success("Order created!");
      navigate(`/orders/${data.order.id}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReset = () => {
    stopAllIntervals();
    setCurrentJob(null);
    setIsGenerating(false);
    setProgress(0);
    setElapsedSeconds(0);
    setPrompt("");
    setStyle("none");
    setDetailLevel([50000]);
  };

  const loadFromHistory = (job: GenerationJob) => {
    setCurrentJob(job);
    setPrompt(job.prompt);
    setStyle(job.style || "none");
    if (job.face_limit) setDetailLevel([job.face_limit]);
    setIsGenerating(false);
    setProgress(job.status === "ready" ? 100 : 0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const getDetailLabel = (value: number) => {
    if (value <= 20000) return "Low";
    if (value <= 70000) return "Medium";
    return "High";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-0">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Ready
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-0">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case "generating":
      case "processing":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-0">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Generating
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-0">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: "rgb(3 7 18 / var(--tw-bg-opacity, 1))" }}
    >
      <DashboardSidebar />

      <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 w-full overflow-x-hidden">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400" />
                Text to 3D
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Generate decorative 3D models from text descriptions
              </p>
            </div>
          </div>

          {/* Prompt Input Card */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3 px-4 sm:px-6">
              <CardTitle className="text-white text-base sm:text-lg">
                Describe your 3D model
              </CardTitle>
              <CardDescription className="text-gray-400 text-sm">
                Be specific about shape, style, and details you want
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
              <div>
                <Textarea
                  placeholder="e.g. A small dragon figurine sitting on a rock, cartoon style with smooth surfaces..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isGenerating}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 min-h-[80px] sm:min-h-[100px] resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {prompt.length}/500
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Style</Label>
                  <Select
                    value={style}
                    onValueChange={setStyle}
                    disabled={isGenerating}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Default</SelectItem>
                      <SelectItem value="cartoon">Cartoon</SelectItem>
                      <SelectItem value="realistic">Realistic</SelectItem>
                      <SelectItem value="lowpoly">Low Poly</SelectItem>
                      <SelectItem value="sculpture">Sculpture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">
                    Detail Level:{" "}
                    <span className="text-purple-400">
                      {getDetailLabel(detailLevel[0])}
                    </span>
                  </Label>
                  <Slider
                    value={detailLevel}
                    onValueChange={setDetailLevel}
                    min={10000}
                    max={100000}
                    step={10000}
                    disabled={isGenerating}
                    className="mt-3"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white h-11"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate 3D Model
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Progress Card */}
          {isGenerating && (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-6 px-4 sm:px-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                    <span className="text-white font-medium">
                      {currentJob?.status === "processing"
                        ? "Processing model..."
                        : "Generating your 3D model..."}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(elapsedSeconds)}
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-gray-500">
                  This usually takes 30-60 seconds. You can stay on this page or
                  check back later from your history.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Preview Card — shows when ready */}
          {currentJob?.status === "ready" && currentJob.file_url && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3 px-4 sm:px-6">
                <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  Your 3D Model is Ready
                </CardTitle>
                <CardDescription className="text-gray-400 text-sm">
                  "{currentJob.prompt}"
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-4 sm:px-6">
                <div className="rounded-xl overflow-hidden border border-gray-700">
                  <ModelViewerUrl
                    url={currentJob.file_url}
                    fileName={currentJob.file_name || "model.glb"}
                    height="350px"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                    onClick={() => {
                      if (!currentJob.file_url) return;
                      const link = document.createElement("a");
                      link.href = currentJob.file_url;
                      link.download =
                        currentJob.file_name || "generated-model.glb";
                      link.target = "_blank";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download GLB
                  </Button>

                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleOrderPrint}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Order Print
                  </Button>

                  <Button
                    variant="outline"
                    className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                    onClick={handleReset}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    New Generation
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error state */}
          {currentJob?.status === "failed" && !isGenerating && (
            <Card className="bg-gray-900 border-red-800/50">
              <CardContent className="py-6 px-4 sm:px-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                  <div className="space-y-2">
                    <p className="text-white font-medium">Generation Failed</p>
                    <p className="text-sm text-gray-400">
                      {currentJob.error_message ||
                        "Something went wrong. Try rewording your prompt or try again."}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      onClick={() => {
                        setCurrentJob(null);
                        setProgress(0);
                      }}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      Try Again
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* History */}
          {history.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader
                className="pb-3 px-4 sm:px-6 cursor-pointer select-none"
                onClick={() => setHistoryOpen(!historyOpen)}
              >
                <CardTitle className="text-white flex items-center justify-between text-sm sm:text-base">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    Previous Generations ({history.length})
                  </div>
                  {historyOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </CardTitle>
              </CardHeader>
              {historyOpen && (
                <CardContent className="px-4 sm:px-6 pb-4 space-y-2">
                  {history.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => loadFromHistory(job)}
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm text-white truncate">
                          {job.prompt}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(job.created_at).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {getStatusBadge(job.status)}
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default TextTo3D;
