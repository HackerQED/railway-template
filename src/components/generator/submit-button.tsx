'use client';

import { Button } from '@/components/ui/button';
import { resolveCreditCost } from '@/config/models';
import { useCreditBalance } from '@/hooks/use-credits';
import { authClient } from '@/lib/auth-client';
import { usePricingDialogStore } from '@/stores/pricing-dialog-store';
import { Loader2Icon, Wand2Icon } from 'lucide-react';
import { useMemo } from 'react';
import { useGenerator } from './generator-context';

const OMNI_EXTENSIONS = ['.mp4', '.mov', '.m4v', '.mp3', '.wav'];

/**
 * Generator submit button with credit pre-check:
 * 1. Not signed in → "Generate" (triggers Google login)
 * 2. Signed in, insufficient credits → "Generate" (opens pricing dialog, no API call)
 * 3. Signed in, sufficient credits → normal submit flow
 */
export function SubmitButton() {
  const { isSubmitting, prompt, submit, model, paramValues, imageUrls } =
    useGenerator();
  const { data: session } = authClient.useSession();
  const openPricingDialog = usePricingDialogStore((s) => s.openPricingDialog);

  const userId = session?.user?.id;
  const { data: creditBalance } = useCreditBalance(userId);

  const hasOmniMedia = useMemo(() => {
    return imageUrls.some((url) => {
      try {
        const pathname = new URL(url).pathname.toLowerCase();
        return OMNI_EXTENSIONS.some((ext) => pathname.endsWith(ext));
      } catch {
        return false;
      }
    });
  }, [imageUrls]);

  const creditCost = useMemo(
    () => resolveCreditCost(model, paramValues, hasOmniMedia),
    [model, paramValues, hasOmniMedia]
  );

  const insufficientCredits =
    creditBalance !== undefined && creditBalance < creditCost;

  // Only disable while the submit API call is in flight;
  // once task_id is returned the button becomes clickable again
  const isDisabled = isSubmitting;

  const handleClick = () => {
    // Not logged in: trigger Google login
    if (!session?.user) {
      authClient.signIn.social({ provider: 'google' });
      return;
    }

    // Insufficient credits: show pricing dialog without sending request
    if (insufficientCredits) {
      openPricingDialog();
      return;
    }

    // Require prompt for normal submit
    if (!prompt.trim()) return;

    submit();
  };

  return (
    <Button
      type="button"
      className="h-12 w-full font-medium text-base"
      disabled={isDisabled}
      onClick={handleClick}
    >
      {isSubmitting ? (
        <Loader2Icon className="mr-2 size-5 animate-spin" />
      ) : (
        <Wand2Icon className="mr-2 size-5" />
      )}
      {isSubmitting ? 'Submitting...' : 'Generate'}
    </Button>
  );
}
