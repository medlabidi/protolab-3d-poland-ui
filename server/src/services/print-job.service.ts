import { v4 as uuidv4 } from 'uuid';

export interface PrintJob {
  jobId: string;
  userId: string;
  filename: string;
  filePath: string;
  fileSize: number;
  status: 'pending' | 'processing' | 'ready' | 'completed' | 'cancelled';
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

// In-memory store (replace with database later)
const jobsStore: Map<string, PrintJob> = new Map();

export function createPrintJob(userId: string, filename: string, fileSize: number): PrintJob {
  const jobId = uuidv4();
  const job: PrintJob = {
    jobId,
    userId,
    filename,
    filePath: `print-jobs/${jobId}/${filename}`,
    fileSize,
    status: 'pending',
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  jobsStore.set(jobId, job);
  return job;
}

export function getJob(jobId: string): PrintJob | undefined {
  return jobsStore.get(jobId);
}

export function updateJob(jobId: string, updates: Partial<PrintJob>): PrintJob | undefined {
  const job = jobsStore.get(jobId);
  if (!job) return undefined;

  const updated = { ...job, ...updates, updatedAt: new Date().toISOString() };
  jobsStore.set(jobId, updated);
  return updated;
}
