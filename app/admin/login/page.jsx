import { redirect } from 'next/navigation';
import { currentAdmin } from '../../../lib/auth';
import LoginForm from '../../../components/LoginForm';
export const metadata = { title:'Admin sign in — Little Hero Books', robots:{index:false,follow:false} };
export const dynamic = 'force-dynamic';
export default async function AdminLogin() {
  try { if (await currentAdmin()) redirect('/admin'); }
  catch(error) { if (error.digest?.startsWith('NEXT_REDIRECT')) throw error; }
  return <main className="login-shell"><LoginForm/></main>;
}
