import { useEffect } from 'react';
import { useAuth } from '@/context/useAuth';
import { useImageStore } from '@/store/useImageStore';
import { fetchImageHistory } from '@/services/imageService';
import ImagePromptInput from './ImagePromptInput';
import ImageResult from './ImageResult';
import ImageHistory from './ImageHistory';

export default function ImageTab() {
  const { user } = useAuth();
  const { history, setHistory } = useImageStore();

  // useEffect(() => {
  //   if (user?.email) {
  //     fetchImageHistory(user.email)
  //       .then(setHistory)
  //       .catch(console.error);
  //   }
  // }, [user?.email, setHistory]);
  useEffect(() => {
    if (user?.email && history.length === 0) {  // ← only fetch if history empty
      fetchImageHistory(user.email)
        .then(setHistory)
        .catch(console.error);
    }
  }, [user?.email, setHistory, history.length]);  

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