import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DownloadTaskItem {
  id: string;
  taskName: string;
  moduleName: string;
  recordCount: number;
  status: 'COMPLETED' | 'PROCESSING' | 'FAILED';
  downloadUrl: string;
  fileName: string;
  createdAt: string;
  fileSizeBytes?: number;
}

interface DownloadCenterState {
  tasks: DownloadTaskItem[];
  addTask: (task: Omit<DownloadTaskItem, 'id' | 'createdAt'>) => string;
  removeTask: (id: string) => void;
  clearCompleted: () => void;
}

export const useDownloadCenterStore = create<DownloadCenterState>()(
  persist(
    (set) => ({
      tasks: [
        {
          id: 'dl-sample-1',
          taskName: 'Báo cáo Vận hành HQ Toàn quốc (Full Fields)',
          moduleName: 'HQ Master Ops',
          recordCount: 126450,
          status: 'COMPLETED',
          downloadUrl: '#',
          fileName: 'HQ_Master_Ops_Full_Report_20260813.csv',
          createdAt: new Date().toISOString(),
          fileSizeBytes: 14580000,
        },
      ],
      addTask: (taskData) => {
        const id = `dl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const newTask: DownloadTaskItem = {
          ...taskData,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          tasks: [newTask, ...state.tasks],
        }));
        return id;
      },
      removeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),
      clearCompleted: () =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.status === 'PROCESSING'),
        })),
    }),
    {
      name: 'nexus-ops-download-center-storage',
    },
  ),
);
