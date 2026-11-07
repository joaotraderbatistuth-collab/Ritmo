import { createFileRoute } from '@tanstack/react-router';
import { SalesPage } from '../components/SalesPage.js';

export const Route = createFileRoute('/vendas')({
  component: SalesPage,
});
