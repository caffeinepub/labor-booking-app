import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileSetupModal() {
  const [name, setName] = useState('');
  const saveProfile = useSaveCallerUserProfile();

  useEffect(() => {
    console.log('[ProfileSetupModal] 🔄 Modal mounted/updated');
    console.log('[ProfileSetupModal] Timestamp:', new Date().toISOString());
    console.log('[ProfileSetupModal] Modal should be visible');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[ProfileSetupModal] 📝 Form submitted');
    console.log('[ProfileSetupModal] Name:', name);
    
    if (!name.trim()) {
      console.warn('[ProfileSetupModal] ⚠️ Empty name submitted');
      toast.error('Please enter your name');
      return;
    }

    try {
      console.log('[ProfileSetupModal] Saving profile...');
      await saveProfile.mutateAsync({ name: name.trim() });
      console.log('[ProfileSetupModal] ✅ Profile saved successfully');
      toast.success('Profile created successfully!');
    } catch (error) {
      console.error('[ProfileSetupModal] ❌ Error saving profile:', error);
      toast.error('Failed to create profile. Please try again.');
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome to LaborLink!</DialogTitle>
          <DialogDescription>
            Please tell us your name to get started.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              disabled={saveProfile.isPending}
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" disabled={saveProfile.isPending}>
            {saveProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Profile...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
