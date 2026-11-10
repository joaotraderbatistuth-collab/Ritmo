import { createFileRoute } from '@tanstack/react-router';
import { FoundersPage } from '../components/FoundersPage.js';

// Página inicial da fase de validação: cadastro dos 50 Fundadores (acesso vitalício).
// A página de vendas completa continua em /vendas.
export const Route = createFileRoute('/')({
  component: FoundersPage,
});
