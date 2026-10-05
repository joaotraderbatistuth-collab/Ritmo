import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest, verifyToken } from '../lib/auth.js';
import {
  getBoards,
  createBoard,
  getBoardById,
  updateBoard,
  duplicateBoard,
  deleteBoard,
  getBoardFullData,
  getBoardLists,
  createList,
  updateList,
  reorderLists,
  deleteList,
  createCard,
  updateCard,
  moveCard,
  deleteCard,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  addComment,
  deleteComment,
  findUserById,
} from '../lib/server-db.js';

// Todas as rotas exigem sessão válida; cada função de server-db.ts já filtra
// por userId, então um usuário nunca consegue ler/editar quadros de outra
// pessoa mesmo manipulando IDs na requisição.
async function requireUser(request: Request) {
  const token = extractTokenFromRequest(request);
  if (!token) return { error: Response.json({ error: 'Não autorizado.' }, { status: 401 }) };
  const payload = await verifyToken(token);
  if (!payload) return { error: Response.json({ error: 'Sessão expirada.' }, { status: 401 }) };
  return { userId: payload.userId, userName: payload.name };
}

export const Route = createFileRoute('/api/boards')({
  server: {
    handlers: {
      // GET /api/boards            -> lista de quadros do usuário
      // GET /api/boards?boardId=X  -> quadro completo (listas, cartões, checklist, comentários)
      GET: async ({ request }) => {
        const auth = await requireUser(request);
        if ('error' in auth) return auth.error;

        const url = new URL(request.url);
        const boardIdParam = url.searchParams.get('boardId');

        if (boardIdParam) {
          const boardId = Number(boardIdParam);
          const board = await getBoardById(boardId, auth.userId);
          if (!board) return Response.json({ error: 'Quadro não encontrado.' }, { status: 404 });
          const full = await getBoardFullData(boardId, auth.userId);
          return Response.json({ board, ...full });
        }

        const boards = await getBoards(auth.userId);
        return Response.json({ boards });
      },

      POST: async ({ request }) => {
        const auth = await requireUser(request);
        if ('error' in auth) return auth.error;
        const { userId, userName } = auth;

        try {
          const body = await request.json();
          const { action } = body;

          // ---- Boards ----
          if (action === 'create_board') {
            if (!body.title?.trim()) return Response.json({ error: 'Título do quadro é obrigatório.' }, { status: 400 });
            const board = await createBoard(userId, { title: body.title.trim(), description: body.description, color: body.color });
            return Response.json({ success: true, board }, { status: 201 });
          }

          if (action === 'rename_board') {
            if (!body.boardId) return Response.json({ error: 'ID do quadro é obrigatório.' }, { status: 400 });
            const board = await updateBoard(Number(body.boardId), userId, {
              title: body.title,
              description: body.description,
              color: body.color,
            });
            if (!board) return Response.json({ error: 'Quadro não encontrado.' }, { status: 404 });
            return Response.json({ success: true, board });
          }

          if (action === 'archive_board') {
            if (!body.boardId) return Response.json({ error: 'ID do quadro é obrigatório.' }, { status: 400 });
            const board = await updateBoard(Number(body.boardId), userId, { archived: body.archived !== false });
            if (!board) return Response.json({ error: 'Quadro não encontrado.' }, { status: 404 });
            return Response.json({ success: true, board });
          }

          if (action === 'duplicate_board') {
            if (!body.boardId) return Response.json({ error: 'ID do quadro é obrigatório.' }, { status: 400 });
            const board = await duplicateBoard(Number(body.boardId), userId);
            if (!board) return Response.json({ error: 'Quadro não encontrado.' }, { status: 404 });
            return Response.json({ success: true, board }, { status: 201 });
          }

          if (action === 'delete_board') {
            if (!body.boardId) return Response.json({ error: 'ID do quadro é obrigatório.' }, { status: 400 });
            await deleteBoard(Number(body.boardId), userId);
            return Response.json({ success: true });
          }

          // ---- Lists ----
          if (action === 'create_list') {
            if (!body.boardId || !body.title?.trim()) {
              return Response.json({ error: 'Quadro e título da lista são obrigatórios.' }, { status: 400 });
            }
            const board = await getBoardById(Number(body.boardId), userId);
            if (!board) return Response.json({ error: 'Quadro não encontrado.' }, { status: 404 });
            const list = await createList(Number(body.boardId), userId, body.title.trim());
            return Response.json({ success: true, list }, { status: 201 });
          }

          if (action === 'rename_list') {
            if (!body.listId) return Response.json({ error: 'ID da lista é obrigatório.' }, { status: 400 });
            const list = await updateList(Number(body.listId), userId, { title: body.title });
            if (!list) return Response.json({ error: 'Lista não encontrada.' }, { status: 404 });
            return Response.json({ success: true, list });
          }

          if (action === 'reorder_lists') {
            if (!body.boardId || !Array.isArray(body.orderedListIds)) {
              return Response.json({ error: 'Quadro e ordem das listas são obrigatórios.' }, { status: 400 });
            }
            // confirma que todas as listas pertencem ao usuário e ao quadro informado
            const ownedLists = await getBoardLists(Number(body.boardId), userId);
            const ownedIds = new Set(ownedLists.map((l) => l.id));
            const ids = body.orderedListIds.map(Number).filter((id: number) => ownedIds.has(id));
            await reorderLists(Number(body.boardId), userId, ids);
            return Response.json({ success: true });
          }

          if (action === 'archive_list') {
            if (!body.listId) return Response.json({ error: 'ID da lista é obrigatório.' }, { status: 400 });
            const list = await updateList(Number(body.listId), userId, { archived: body.archived !== false });
            if (!list) return Response.json({ error: 'Lista não encontrada.' }, { status: 404 });
            return Response.json({ success: true, list });
          }

          if (action === 'delete_list') {
            if (!body.listId) return Response.json({ error: 'ID da lista é obrigatório.' }, { status: 400 });
            await deleteList(Number(body.listId), userId);
            return Response.json({ success: true });
          }

          // ---- Cards ----
          if (action === 'create_card') {
            if (!body.listId || !body.title?.trim()) {
              return Response.json({ error: 'Lista e título do cartão são obrigatórios.' }, { status: 400 });
            }
            try {
              const card = await createCard(Number(body.listId), userId, {
                title: body.title.trim(),
                description: body.description,
                priority: body.priority,
                labels: Array.isArray(body.labels) ? body.labels : [],
                assignee: body.assignee,
                dueDate: body.dueDate,
              });
              return Response.json({ success: true, card }, { status: 201 });
            } catch (e: any) {
              return Response.json({ error: e.message || 'Não foi possível criar o cartão.' }, { status: 400 });
            }
          }

          if (action === 'update_card') {
            if (!body.cardId) return Response.json({ error: 'ID do cartão é obrigatório.' }, { status: 400 });
            const card = await updateCard(Number(body.cardId), userId, {
              title: body.title,
              description: body.description,
              priority: body.priority,
              labels: Array.isArray(body.labels) ? body.labels : undefined,
              assignee: body.assignee,
              dueDate: body.dueDate,
            });
            if (!card) return Response.json({ error: 'Cartão não encontrado.' }, { status: 404 });
            return Response.json({ success: true, card });
          }

          if (action === 'move_card') {
            if (!body.cardId || !body.targetListId || body.targetPosition === undefined) {
              return Response.json({ error: 'Cartão, lista de destino e posição são obrigatórios.' }, { status: 400 });
            }
            const ok = await moveCard(Number(body.cardId), userId, Number(body.targetListId), Number(body.targetPosition));
            if (!ok) return Response.json({ error: 'Não foi possível mover o cartão (verifique se pertence à sua conta).' }, { status: 404 });
            return Response.json({ success: true });
          }

          if (action === 'archive_card') {
            if (!body.cardId) return Response.json({ error: 'ID do cartão é obrigatório.' }, { status: 400 });
            const card = await updateCard(Number(body.cardId), userId, { archived: body.archived !== false });
            if (!card) return Response.json({ error: 'Cartão não encontrado.' }, { status: 404 });
            return Response.json({ success: true, card });
          }

          if (action === 'delete_card') {
            if (!body.cardId) return Response.json({ error: 'ID do cartão é obrigatório.' }, { status: 400 });
            await deleteCard(Number(body.cardId), userId);
            return Response.json({ success: true });
          }

          // ---- Checklist ----
          if (action === 'add_checklist_item') {
            if (!body.cardId || !body.text?.trim()) {
              return Response.json({ error: 'Cartão e texto do item são obrigatórios.' }, { status: 400 });
            }
            try {
              const item = await addChecklistItem(Number(body.cardId), userId, body.text.trim());
              return Response.json({ success: true, item }, { status: 201 });
            } catch (e: any) {
              return Response.json({ error: e.message || 'Não foi possível adicionar o item.' }, { status: 400 });
            }
          }

          if (action === 'toggle_checklist_item') {
            if (!body.itemId) return Response.json({ error: 'ID do item é obrigatório.' }, { status: 400 });
            const ok = await toggleChecklistItem(Number(body.itemId), userId, Boolean(body.done));
            if (!ok) return Response.json({ error: 'Item não encontrado.' }, { status: 404 });
            return Response.json({ success: true });
          }

          if (action === 'delete_checklist_item') {
            if (!body.itemId) return Response.json({ error: 'ID do item é obrigatório.' }, { status: 400 });
            await deleteChecklistItem(Number(body.itemId), userId);
            return Response.json({ success: true });
          }

          // ---- Comentários / atividade ----
          if (action === 'add_comment') {
            if (!body.cardId || !body.text?.trim()) {
              return Response.json({ error: 'Cartão e texto do comentário são obrigatórios.' }, { status: 400 });
            }
            try {
              const user = await findUserById(userId);
              const comment = await addComment(Number(body.cardId), userId, user?.name || userName, body.text.trim());
              return Response.json({ success: true, comment }, { status: 201 });
            } catch (e: any) {
              return Response.json({ error: e.message || 'Não foi possível adicionar o comentário.' }, { status: 400 });
            }
          }

          if (action === 'delete_comment') {
            if (!body.commentId) return Response.json({ error: 'ID do comentário é obrigatório.' }, { status: 400 });
            await deleteComment(Number(body.commentId), userId);
            return Response.json({ success: true });
          }

          return Response.json({ error: 'Ação não reconhecida.' }, { status: 400 });
        } catch (e: any) {
          return Response.json({ error: e.message || 'Erro no servidor.' }, { status: 500 });
        }
      },
    },
  },
});
