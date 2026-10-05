import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BoardItem,
  BoardListItem,
  BoardCardItem,
  BoardChecklistItemType,
  BoardCardCommentItem,
  BoardCardPriority,
} from '../lib/types.js';
import {
  Plus,
  LayoutGrid,
  X,
  Trash2,
  Copy,
  Archive,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Tag,
  CalendarDays,
  CheckSquare,
  MessageSquare,
  Search,
  Loader2,
  AlertTriangle,
  Pencil,
} from 'lucide-react';

// -----------------------------------------------------------------------------
// Módulo "Quadros" — organização visual estilo Kanban, persistido via /api/boards.
// Arrastar-e-soltar nativo (HTML5 DnD, sem dependência extra) + botões de
// mover acessíveis por teclado como alternativa.
// -----------------------------------------------------------------------------

const PRIORITY_STYLES: Record<BoardCardPriority, string> = {
  baixa: 'bg-sky-950 text-sky-300 border-sky-800',
  media: 'bg-amber-950 text-amber-300 border-amber-800',
  alta: 'bg-rose-950 text-rose-300 border-rose-800',
};

const PRIORITY_LABELS: Record<BoardCardPriority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

interface BoardFullState {
  board: BoardItem;
  lists: BoardListItem[];
  cards: BoardCardItem[];
  checklistItems: BoardChecklistItemType[];
  comments: BoardCardCommentItem[];
}

async function api(action: string, payload: Record<string, any> = {}) {
  const res = await fetch('/api/boards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao comunicar com o servidor.');
  return data;
}

export const TabBoards: React.FC = () => {
  const [boards, setBoards] = useState<BoardItem[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
  const [boardData, setBoardData] = useState<BoardFullState | null>(null);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [error, setError] = useState('');

  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [showNewBoardForm, setShowNewBoardForm] = useState(false);

  const [newListTitle, setNewListTitle] = useState('');
  const [addingList, setAddingList] = useState(false);

  const [newCardTitleByList, setNewCardTitleByList] = useState<Record<number, string>>({});
  const [addingCardToList, setAddingCardToList] = useState<number | null>(null);

  const [activeCardId, setActiveCardId] = useState<number | null>(null);
  const [draggingCardId, setDraggingCardId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<{ listId: number; index: number } | null>(null);

  const [searchText, setSearchText] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('todas');
  const [filterListId, setFilterListId] = useState<string>('todas');
  const [filterLabel, setFilterLabel] = useState<string>('todas');

  // -------------------------------------------------------------
  // Carregamento de dados
  // -------------------------------------------------------------
  const fetchBoards = useCallback(async () => {
    setLoadingBoards(true);
    setError('');
    try {
      const res = await fetch('/api/boards');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível carregar seus quadros.');
      setBoards(data.boards || []);
      if (data.boards?.length > 0 && !selectedBoardId) {
        setSelectedBoardId(data.boards[0].id);
      }
    } catch (e: any) {
      setError(e.message || 'Não foi possível carregar seus quadros.');
    } finally {
      setLoadingBoards(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBoard = useCallback(async (boardId: number) => {
    setLoadingBoard(true);
    setError('');
    try {
      const res = await fetch(`/api/boards?boardId=${boardId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível carregar o quadro.');
      setBoardData(data);
    } catch (e: any) {
      setError(e.message || 'Não foi possível carregar o quadro.');
      setBoardData(null);
    } finally {
      setLoadingBoard(false);
    }
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  useEffect(() => {
    if (selectedBoardId) fetchBoard(selectedBoardId);
    else setBoardData(null);
  }, [selectedBoardId, fetchBoard]);

  // -------------------------------------------------------------
  // Quadros
  // -------------------------------------------------------------
  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) return;
    setCreatingBoard(true);
    try {
      const data = await api('create_board', { title: newBoardTitle.trim() });
      setNewBoardTitle('');
      setShowNewBoardForm(false);
      await fetchBoards();
      setSelectedBoardId(data.board.id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreatingBoard(false);
    }
  };

  const handleDuplicateBoard = async (boardId: number) => {
    try {
      const data = await api('duplicate_board', { boardId });
      await fetchBoards();
      setSelectedBoardId(data.board.id);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDeleteBoard = async (boardId: number) => {
    if (!confirm('Excluir este quadro e todas as suas listas e cartões? Essa ação não pode ser desfeita.')) return;
    try {
      await api('delete_board', { boardId });
      const remaining = boards.filter((b) => b.id !== boardId);
      setBoards(remaining);
      setSelectedBoardId(remaining[0]?.id ?? null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  // -------------------------------------------------------------
  // Listas
  // -------------------------------------------------------------
  const handleAddList = async () => {
    if (!newListTitle.trim() || !selectedBoardId) return;
    setAddingList(true);
    try {
      await api('create_list', { boardId: selectedBoardId, title: newListTitle.trim() });
      setNewListTitle('');
      await fetchBoard(selectedBoardId);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAddingList(false);
    }
  };

  const handleRenameList = async (listId: number, title: string) => {
    if (!title.trim() || !selectedBoardId) return;
    try {
      await api('rename_list', { listId, title: title.trim() });
      await fetchBoard(selectedBoardId);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDeleteList = async (listId: number) => {
    if (!confirm('Excluir esta lista e todos os cartões dentro dela?')) return;
    if (!selectedBoardId) return;
    try {
      await api('delete_list', { listId });
      await fetchBoard(selectedBoardId);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const moveListPosition = async (listId: number, direction: -1 | 1) => {
    if (!boardData || !selectedBoardId) return;
    const ids = boardData.lists.map((l) => l.id);
    const idx = ids.indexOf(listId);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= ids.length) return;
    [ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]];
    // atualização otimista
    const reordered = ids.map((id) => boardData.lists.find((l) => l.id === id)!);
    setBoardData({ ...boardData, lists: reordered });
    try {
      await api('reorder_lists', { boardId: selectedBoardId, orderedListIds: ids });
    } catch (e: any) {
      setError(e.message);
      fetchBoard(selectedBoardId);
    }
  };

  // -------------------------------------------------------------
  // Cartões
  // -------------------------------------------------------------
  const handleAddCard = async (listId: number) => {
    const title = (newCardTitleByList[listId] || '').trim();
    if (!title || !selectedBoardId) return;
    setAddingCardToList(listId);
    try {
      await api('create_card', { listId, title });
      setNewCardTitleByList((prev) => ({ ...prev, [listId]: '' }));
      await fetchBoard(selectedBoardId);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAddingCardToList(null);
    }
  };

  const handleUpdateCard = async (cardId: number, updates: Partial<BoardCardItem>) => {
    if (!selectedBoardId) return;
    try {
      await api('update_card', { cardId, ...updates });
      await fetchBoard(selectedBoardId);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    if (!confirm('Excluir este cartão?')) return;
    if (!selectedBoardId) return;
    try {
      await api('delete_card', { cardId });
      setActiveCardId(null);
      await fetchBoard(selectedBoardId);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const performMoveCard = async (cardId: number, targetListId: number, targetPosition: number) => {
    if (!boardData || !selectedBoardId) return;

    // atualização otimista local
    const card = boardData.cards.find((c) => c.id === cardId);
    if (!card) return;
    const otherCards = boardData.cards.filter((c) => c.id !== cardId);
    const targetListCards = otherCards.filter((c) => c.listId === targetListId).sort((a, b) => a.position - b.position);
    const clamped = Math.max(0, Math.min(targetPosition, targetListCards.length));
    targetListCards.splice(clamped, 0, { ...card, listId: targetListId });
    const rest = otherCards.filter((c) => c.listId !== targetListId);
    const reindexed = targetListCards.map((c, i) => ({ ...c, position: i }));
    setBoardData({ ...boardData, cards: [...rest, ...reindexed] });

    try {
      await api('move_card', { cardId, targetListId, targetPosition: clamped });
    } catch (e: any) {
      setError(e.message);
      fetchBoard(selectedBoardId);
    }
  };

  // Mover cartão via teclado/botões: para a lista anterior/seguinte, ou
  // uma posição acima/abaixo dentro da mesma lista.
  const moveCardKeyboard = (card: BoardCardItem, direction: 'left' | 'right' | 'up' | 'down') => {
    if (!boardData) return;
    const lists = boardData.lists;
    const listIdx = lists.findIndex((l) => l.id === card.listId);
    const cardsInList = boardData.cards.filter((c) => c.listId === card.listId).sort((a, b) => a.position - b.position);
    const posInList = cardsInList.findIndex((c) => c.id === card.id);

    if (direction === 'left' && listIdx > 0) {
      performMoveCard(card.id, lists[listIdx - 1].id, 0);
    } else if (direction === 'right' && listIdx < lists.length - 1) {
      performMoveCard(card.id, lists[listIdx + 1].id, 0);
    } else if (direction === 'up' && posInList > 0) {
      performMoveCard(card.id, card.listId, posInList - 1);
    } else if (direction === 'down' && posInList < cardsInList.length - 1) {
      performMoveCard(card.id, card.listId, posInList + 1);
    }
  };

  // -------------------------------------------------------------
  // Drag-and-drop nativo (HTML5)
  // -------------------------------------------------------------
  const handleDragStart = (cardId: number) => setDraggingCardId(cardId);

  const handleDragOverCard = (e: React.DragEvent, listId: number, index: number) => {
    e.preventDefault();
    setDropTarget({ listId, index });
  };

  const handleDragOverList = (e: React.DragEvent, listId: number, cardCount: number) => {
    e.preventDefault();
    if (!dropTarget || dropTarget.listId !== listId) {
      setDropTarget({ listId, index: cardCount });
    }
  };

  const handleDrop = () => {
    if (draggingCardId && dropTarget) {
      performMoveCard(draggingCardId, dropTarget.listId, dropTarget.index);
    }
    setDraggingCardId(null);
    setDropTarget(null);
  };

  // -------------------------------------------------------------
  // Dados derivados (filtros, busca)
  // -------------------------------------------------------------
  const allLabels = useMemo(() => {
    if (!boardData) return [];
    const set = new Set<string>();
    boardData.cards.forEach((c) => c.labels.forEach((l) => set.add(l)));
    return Array.from(set);
  }, [boardData]);

  const filteredCards = useMemo(() => {
    if (!boardData) return [];
    return boardData.cards.filter((c) => {
      if (searchText && !c.title.toLowerCase().includes(searchText.toLowerCase()) && !(c.description || '').toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }
      if (filterPriority !== 'todas' && c.priority !== filterPriority) return false;
      if (filterListId !== 'todas' && String(c.listId) !== filterListId) return false;
      if (filterLabel !== 'todas' && !c.labels.includes(filterLabel)) return false;
      return true;
    });
  }, [boardData, searchText, filterPriority, filterListId, filterLabel]);

  const activeCard = boardData?.cards.find((c) => c.id === activeCardId) || null;

  // -------------------------------------------------------------
  // Estados de carregamento / vazio / erro
  // -------------------------------------------------------------
  if (loadingBoards) {
    return (
      <div className="flex items-center justify-center py-24 text-[#8b949e]">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando seus quadros...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-emerald-400" /> Quadros
          </h2>
          <p className="text-xs text-[#8b949e] mt-0.5">
            Organize tarefas e projetos visualmente, estilo Kanban. Arraste os cartões ou use os botões de mover.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-rose-400 hover:text-rose-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Seletor de quadros */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {boards.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedBoardId(b.id)}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
              selectedBoardId === b.id
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/20'
                : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] hover:border-[#484f58]'
            }`}
          >
            {b.title}
          </button>
        ))}
        {!showNewBoardForm ? (
          <button
            onClick={() => setShowNewBoardForm(true)}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-dashed border-[#30363d] text-[#8b949e] hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Novo quadro
          </button>
        ) : (
          <div className="shrink-0 flex items-center gap-1.5">
            <input
              autoFocus
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
              placeholder="Nome do quadro"
              className="bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] focus:outline-none focus:border-emerald-500 w-40"
            />
            <button
              onClick={handleCreateBoard}
              disabled={creatingBoard}
              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50"
            >
              {creatingBoard ? '...' : 'Criar'}
            </button>
            <button
              onClick={() => setShowNewBoardForm(false)}
              className="p-2 rounded-lg text-[#8b949e] hover:text-[#f0f6fc]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {boards.length === 0 && !showNewBoardForm && (
        <div className="text-center py-16 bg-[#161b22] border border-dashed border-[#30363d] rounded-2xl">
          <LayoutGrid className="w-8 h-8 text-[#8b949e] mx-auto mb-3" />
          <p className="text-sm text-[#f0f6fc] font-medium">Você ainda não tem nenhum quadro</p>
          <p className="text-xs text-[#8b949e] mt-1 mb-4">
            Crie seu primeiro quadro — ele já vem com as colunas "A fazer", "Em andamento" e "Concluído".
          </p>
          <button
            onClick={() => setShowNewBoardForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Criar meu primeiro quadro
          </button>
        </div>
      )}

      {selectedBoardId && (
        <>
          {/* Ações do quadro + busca/filtros */}
          {boardData && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#161b22] border border-[#30363d] p-3.5 rounded-2xl">
              <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Buscar cartões..."
                    className="bg-[#0d1117] border border-[#30363d] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#f0f6fc] focus:outline-none focus:border-emerald-500 w-40"
                  />
                </div>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="bg-[#0d1117] border border-[#30363d] text-xs text-[#f0f6fc] rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="todas">Toda prioridade</option>
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
                <select
                  value={filterListId}
                  onChange={(e) => setFilterListId(e.target.value)}
                  className="bg-[#0d1117] border border-[#30363d] text-xs text-[#f0f6fc] rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="todas">Toda coluna</option>
                  {boardData.lists.map((l) => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
                {allLabels.length > 0 && (
                  <select
                    value={filterLabel}
                    onChange={(e) => setFilterLabel(e.target.value)}
                    className="bg-[#0d1117] border border-[#30363d] text-xs text-[#f0f6fc] rounded-lg px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="todas">Toda etiqueta</option>
                    {allLabels.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleDuplicateBoard(boardData.board.id)}
                  title="Duplicar quadro"
                  className="p-2 rounded-lg text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#0d1117] transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteBoard(boardData.board.id)}
                  title="Excluir quadro"
                  className="p-2 rounded-lg text-[#8b949e] hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {loadingBoard && (
            <div className="flex items-center justify-center py-16 text-[#8b949e]">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando quadro...
            </div>
          )}

          {!loadingBoard && boardData && (
            <div className="flex items-start gap-4 overflow-x-auto pb-4">
              {boardData.lists.map((list, listIdx) => {
                const listCards = filteredCards
                  .filter((c) => c.listId === list.id)
                  .sort((a, b) => a.position - b.position);

                return (
                  <div
                    key={list.id}
                    onDragOver={(e) => handleDragOverList(e, list.id, listCards.length)}
                    onDrop={handleDrop}
                    className="shrink-0 w-72 bg-[#161b22] border border-[#30363d] rounded-2xl p-3 flex flex-col max-h-[calc(100vh-280px)]"
                  >
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#30363d] mb-2">
                      <input
                        defaultValue={list.title}
                        onBlur={(e) => e.target.value !== list.title && handleRenameList(list.id, e.target.value)}
                        aria-label="Nome da coluna"
                        className="bg-transparent text-sm font-semibold text-[#f0f6fc] focus:outline-none focus:bg-[#0d1117] rounded px-1 -ml-1 w-full"
                      />
                      <span className="text-[10px] text-[#8b949e] shrink-0">{listCards.length}</span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => moveListPosition(list.id, -1)}
                          disabled={listIdx === 0}
                          title="Mover coluna para a esquerda"
                          className="p-1 rounded text-[#8b949e] hover:text-[#f0f6fc] disabled:opacity-20"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveListPosition(list.id, 1)}
                          disabled={listIdx === boardData.lists.length - 1}
                          title="Mover coluna para a direita"
                          className="p-1 rounded text-[#8b949e] hover:text-[#f0f6fc] disabled:opacity-20"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteList(list.id)}
                          title="Excluir coluna"
                          className="p-1 rounded text-[#8b949e] hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 min-h-[40px]">
                      {listCards.map((card, cardIdx) => {
                        const checklistForCard = boardData.checklistItems.filter((i) => i.cardId === card.id);
                        const doneCount = checklistForCard.filter((i) => i.done).length;
                        const isOverdue = card.dueDate && card.dueDate < new Date().toISOString().split('T')[0];

                        return (
                          <div
                            key={card.id}
                            draggable
                            onDragStart={() => handleDragStart(card.id)}
                            onDragOver={(e) => handleDragOverCard(e, list.id, cardIdx)}
                            onDrop={handleDrop}
                            onClick={() => setActiveCardId(card.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setActiveCardId(card.id);
                              if (e.key === 'ArrowLeft') { e.preventDefault(); moveCardKeyboard(card, 'left'); }
                              if (e.key === 'ArrowRight') { e.preventDefault(); moveCardKeyboard(card, 'right'); }
                              if (e.key === 'ArrowUp') { e.preventDefault(); moveCardKeyboard(card, 'up'); }
                              if (e.key === 'ArrowDown') { e.preventDefault(); moveCardKeyboard(card, 'down'); }
                            }}
                            className={`group bg-[#0d1117] border rounded-xl p-2.5 cursor-pointer transition-all ${
                              draggingCardId === card.id ? 'opacity-40' : 'border-[#30363d] hover:border-emerald-500/50'
                            }`}
                          >
                            <p className="text-xs font-medium text-[#f0f6fc] mb-1.5">{card.title}</p>
                            <div className="flex items-center flex-wrap gap-1 mb-1.5">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${PRIORITY_STYLES[card.priority]}`}>
                                {PRIORITY_LABELS[card.priority]}
                              </span>
                              {card.labels.slice(0, 3).map((l) => (
                                <span key={l} className="text-[9px] px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] flex items-center gap-0.5">
                                  <Tag className="w-2.5 h-2.5" /> {l}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-[#8b949e]">
                              <div className="flex items-center gap-2">
                                {card.dueDate && (
                                  <span className={`flex items-center gap-0.5 ${isOverdue ? 'text-rose-400' : ''}`}>
                                    <CalendarDays className="w-3 h-3" />
                                    {new Date(card.dueDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                  </span>
                                )}
                                {checklistForCard.length > 0 && (
                                  <span className="flex items-center gap-0.5">
                                    <CheckSquare className="w-3 h-3" /> {doneCount}/{checklistForCard.length}
                                  </span>
                                )}
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveCardKeyboard(card, 'left'); }}
                                  title="Mover para a coluna anterior"
                                  className="p-0.5 hover:text-emerald-400"
                                >
                                  <ChevronLeft className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveCardKeyboard(card, 'right'); }}
                                  title="Mover para a próxima coluna"
                                  className="p-0.5 hover:text-emerald-400"
                                >
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {listCards.length === 0 && (
                        <p className="text-[11px] text-[#484f58] text-center py-3">Nenhum cartão aqui</p>
                      )}
                    </div>

                    <div className="pt-2 mt-1">
                      <div className="flex gap-1.5">
                        <input
                          value={newCardTitleByList[list.id] || ''}
                          onChange={(e) => setNewCardTitleByList((prev) => ({ ...prev, [list.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddCard(list.id)}
                          placeholder="+ Adicionar cartão"
                          className="flex-1 bg-transparent border border-dashed border-[#30363d] rounded-lg px-2.5 py-1.5 text-xs text-[#f0f6fc] placeholder:text-[#484f58] focus:outline-none focus:border-emerald-500/50"
                        />
                        {newCardTitleByList[list.id]?.trim() && (
                          <button
                            onClick={() => handleAddCard(list.id)}
                            disabled={addingCardToList === list.id}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50"
                          >
                            OK
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Nova coluna */}
              <div className="shrink-0 w-72">
                <div className="flex gap-1.5">
                  <input
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddList()}
                    placeholder="+ Adicionar outra coluna"
                    className="flex-1 bg-[#161b22] border border-dashed border-[#30363d] rounded-xl px-3 py-2.5 text-xs text-[#f0f6fc] placeholder:text-[#8b949e] focus:outline-none focus:border-emerald-500/50"
                  />
                  {newListTitle.trim() && (
                    <button
                      onClick={handleAddList}
                      disabled={addingList}
                      className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50"
                    >
                      OK
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeCard && boardData && (
        <CardDetailModal
          card={activeCard}
          lists={boardData.lists}
          checklistItems={boardData.checklistItems.filter((i) => i.cardId === activeCard.id)}
          comments={boardData.comments.filter((c) => c.cardId === activeCard.id).sort((a, b) => (a.createdAt! < b.createdAt! ? -1 : 1))}
          onClose={() => setActiveCardId(null)}
          onUpdate={(updates) => handleUpdateCard(activeCard.id, updates)}
          onDelete={() => handleDeleteCard(activeCard.id)}
          onMove={(targetListId) => performMoveCard(activeCard.id, targetListId, 0)}
          onAddChecklistItem={async (text) => {
            try {
              await api('add_checklist_item', { cardId: activeCard.id, text });
              if (selectedBoardId) await fetchBoard(selectedBoardId);
            } catch (e: any) { setError(e.message); }
          }}
          onToggleChecklistItem={async (itemId, done) => {
            try {
              await api('toggle_checklist_item', { itemId, done });
              if (selectedBoardId) await fetchBoard(selectedBoardId);
            } catch (e: any) { setError(e.message); }
          }}
          onDeleteChecklistItem={async (itemId) => {
            try {
              await api('delete_checklist_item', { itemId });
              if (selectedBoardId) await fetchBoard(selectedBoardId);
            } catch (e: any) { setError(e.message); }
          }}
          onAddComment={async (text) => {
            try {
              await api('add_comment', { cardId: activeCard.id, text });
              if (selectedBoardId) await fetchBoard(selectedBoardId);
            } catch (e: any) { setError(e.message); }
          }}
        />
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Modal de detalhes do cartão
// -----------------------------------------------------------------------------
interface CardDetailModalProps {
  card: BoardCardItem;
  lists: BoardListItem[];
  checklistItems: BoardChecklistItemType[];
  comments: BoardCardCommentItem[];
  onClose: () => void;
  onUpdate: (updates: Partial<BoardCardItem>) => void;
  onDelete: () => void;
  onMove: (targetListId: number) => void;
  onAddChecklistItem: (text: string) => void;
  onToggleChecklistItem: (itemId: number, done: boolean) => void;
  onDeleteChecklistItem: (itemId: number) => void;
  onAddComment: (text: string) => void;
}

const CardDetailModal: React.FC<CardDetailModalProps> = ({
  card,
  lists,
  checklistItems,
  comments,
  onClose,
  onUpdate,
  onDelete,
  onMove,
  onAddChecklistItem,
  onToggleChecklistItem,
  onDeleteChecklistItem,
  onAddComment,
}) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [labelsText, setLabelsText] = useState(card.labels.join(', '));
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);

  const doneCount = checklistItems.filter((i) => i.done).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#8b949e] hover:text-[#f0f6fc]" aria-label="Fechar">
          <X className="w-5 h-5" />
        </button>

        {/* Título */}
        {editingTitle ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => { setEditingTitle(false); if (title.trim() && title !== card.title) onUpdate({ title: title.trim() }); }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="w-full bg-[#0d1117] border border-emerald-500 rounded-lg px-3 py-2 text-base font-bold text-[#f0f6fc] focus:outline-none mb-4"
          />
        ) : (
          <button onClick={() => setEditingTitle(true)} className="flex items-start gap-2 text-left mb-4 group">
            <h3 className="text-base font-bold text-[#f0f6fc] pr-6">{card.title}</h3>
            <Pencil className="w-3.5 h-3.5 text-[#8b949e] opacity-0 group-hover:opacity-100 mt-1 shrink-0" />
          </button>
        )}

        {/* Linha de metadados: prioridade / coluna / vencimento */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-[10px] uppercase tracking-wide text-[#8b949e] block mb-1">Prioridade</label>
            <select
              value={card.priority}
              onChange={(e) => onUpdate({ priority: e.target.value as BoardCardPriority })}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1.5 text-xs text-[#f0f6fc] focus:outline-none"
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-[#8b949e] block mb-1">Coluna</label>
            <select
              value={card.listId}
              onChange={(e) => onMove(Number(e.target.value))}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1.5 text-xs text-[#f0f6fc] focus:outline-none"
            >
              {lists.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-[#8b949e] block mb-1">Vencimento</label>
            <input
              type="date"
              value={card.dueDate || ''}
              onChange={(e) => onUpdate({ dueDate: e.target.value || undefined })}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1.5 text-xs text-[#f0f6fc] focus:outline-none"
            />
          </div>
        </div>

        {/* Responsável + Etiquetas */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[10px] uppercase tracking-wide text-[#8b949e] block mb-1">Responsável</label>
            <input
              defaultValue={card.assignee || ''}
              onBlur={(e) => e.target.value !== card.assignee && onUpdate({ assignee: e.target.value })}
              placeholder="Opcional"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1.5 text-xs text-[#f0f6fc] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-[#8b949e] block mb-1">Etiquetas (separadas por vírgula)</label>
            <input
              value={labelsText}
              onChange={(e) => setLabelsText(e.target.value)}
              onBlur={() => onUpdate({ labels: labelsText.split(',').map((s) => s.trim()).filter(Boolean) })}
              placeholder="ex.: urgente, cliente-x"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1.5 text-xs text-[#f0f6fc] focus:outline-none"
            />
          </div>
        </div>

        {/* Descrição */}
        <div className="mb-4">
          <label className="text-[10px] uppercase tracking-wide text-[#8b949e] block mb-1">Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => description !== (card.description || '') && onUpdate({ description })}
            rows={3}
            placeholder="Detalhes do cartão..."
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] focus:outline-none focus:border-emerald-500 resize-none"
          />
        </div>

        {/* Checklist */}
        <div className="mb-4">
          <label className="text-[10px] uppercase tracking-wide text-[#8b949e] flex items-center gap-1.5 mb-2">
            <CheckSquare className="w-3.5 h-3.5" /> Checklist {checklistItems.length > 0 && `(${doneCount}/${checklistItems.length})`}
          </label>
          <div className="space-y-1.5">
            {checklistItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 group">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={(e) => onToggleChecklistItem(item.id, e.target.checked)}
                  className="rounded border-[#30363d] bg-[#0d1117] text-emerald-500 focus:ring-0"
                />
                <span className={`text-xs flex-1 ${item.done ? 'line-through text-[#8b949e]' : 'text-[#f0f6fc]'}`}>{item.text}</span>
                <button
                  onClick={() => onDeleteChecklistItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-[#8b949e] hover:text-rose-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 mt-2">
            <input
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newChecklistText.trim()) {
                  onAddChecklistItem(newChecklistText.trim());
                  setNewChecklistText('');
                }
              }}
              placeholder="+ Adicionar item"
              className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 py-1.5 text-xs text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Comentários / atividade */}
        <div className="mb-4">
          <label className="text-[10px] uppercase tracking-wide text-[#8b949e] flex items-center gap-1.5 mb-2">
            <MessageSquare className="w-3.5 h-3.5" /> Comentários
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {comments.length === 0 && <p className="text-[11px] text-[#484f58]">Nenhum comentário ainda.</p>}
            {comments.map((c) => (
              <div key={c.id} className="bg-[#0d1117] border border-[#30363d] rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-emerald-400">{c.authorName}</span>
                  <span className="text-[9px] text-[#8b949e]">{c.createdAt && new Date(c.createdAt).toLocaleString('pt-BR')}</span>
                </div>
                <p className="text-xs text-[#f0f6fc] mt-0.5">{c.text}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 mt-2">
            <input
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newCommentText.trim()) {
                  onAddComment(newCommentText.trim());
                  setNewCommentText('');
                }
              }}
              placeholder="Escrever um comentário..."
              className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 py-1.5 text-xs text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-[#30363d]">
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" /> Excluir cartão
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] text-xs font-semibold">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
