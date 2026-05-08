import { useImageStore } from '@/store/useImageStore';
import ImagePromptInput from './ImagePromptInput';
import ImageResult from './ImageResult';
import ImageHistory from './ImageHistory';

export default function ImageTab() {
  const { history } = useImageStore();

  // ← history fetch removed from here, now lives in imageStore.tsx

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ImagePromptInput />
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        <ImageResult />
        <ImageHistory images={history} />
      </div>
    </div>
  );
}