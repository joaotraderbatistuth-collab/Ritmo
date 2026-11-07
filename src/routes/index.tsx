import { createFileRoute } from '@tanstack/react-router';
import { SalesPage } from '../components/SalesPage.js';

// A página inicial é a mesma página de vendas completa (também em /vendas).
export const Route = createFileRoute('/')({
  component: SalesPage,
});
