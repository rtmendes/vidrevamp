import { redirect } from 'next/navigation';

// Root redirects to the main dashboard feed
export default function Home() {
  redirect('/dashboard/videos');
}
