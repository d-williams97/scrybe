import { nanoid } from "nanoid";
import type { Job, JobResult, JobStatus } from "@/app/types";

class InMemoryJobManager {
  private jobs = new Map<string, Job>();

  create(): Job {
    const id = nanoid();
    const job: Job = {
      id,
      status: "queued",
      progress: 0,
      createdAt: Date.now(),
    };
    this.jobs.set(id, job);
    return job;
  }

  update(id: string, partial: Partial<Job>) {
    const job = this.jobs.get(id);
    if (!job) return;
    Object.assign(job, partial);
  }

  succeed(id: string, result: JobResult) {
    this.update(id, { status: "ready", progress: 100, result });
  }

  fail(id: string, message: string) {
    this.update(id, {
      status: "error",
      progress: 100,
      result: { error: message },
    });
  }

  get(id: string) {
    console.log("fetching id", id);
    console.log("jobs", this.jobs);
    return this.jobs.get(id);
  }
}
export const jobManager = new InMemoryJobManager();
