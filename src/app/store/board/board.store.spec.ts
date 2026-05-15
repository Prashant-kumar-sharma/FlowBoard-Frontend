import * as BoardActions from './board.actions';
import { boardReducer, initialState } from './board.reducer';
import { selectAllCards, selectBoard, selectCardsByList, selectError, selectLists, selectLoading, selectOverdueCards } from './board.selectors';

describe('Board Store', () => {
  it('creates board actions with payloads', () => {
    expect(BoardActions.clearBoard().type).toBe('[Board] Clear Board');
    expect(BoardActions.loadBoard({ boardId: 3 }).boardId).toBe(3);
    expect(BoardActions.addCard({ card: { id: 1 } }).card.id).toBe(1);
    expect(BoardActions.webSocketCommentAdded({ cardId: 4 }).cardId).toBe(4);
  });

  it('updates state through the reducer', () => {
    const loaded = boardReducer(initialState, BoardActions.loadBoardSuccess({
      board: { id: 1 },
      lists: [{ id: 10 }],
      cards: [{ id: 100, listId: 10, position: 2 }]
    }));
    expect(loaded.board.id).toBe(1);

    const addedCard = boardReducer(loaded, BoardActions.addCard({ card: { id: 101, listId: 10 } }));
    expect(addedCard.cards.length).toBe(2);

    const updatedCard = boardReducer(addedCard, BoardActions.updateCard({ card: { id: 100, listId: 10, position: 1 } }));
    expect(updatedCard.cards.find(card => card.id === 100)?.position).toBe(1);

    const movedCard = boardReducer(updatedCard, BoardActions.webSocketCardMoved({ cardId: 100, toListId: 11 }));
    expect(movedCard.cards.find(card => card.id === 100)?.listId).toBe(11);

    const archivedCard = boardReducer(movedCard, BoardActions.archiveCard({ cardId: 101 }));
    expect(archivedCard.cards.find(card => card.id === 101)?.isArchived).toBeTrue();

    const addedList = boardReducer(archivedCard, BoardActions.addList({ list: { id: 11, name: 'Doing' } }));
    expect(addedList.lists.length).toBe(2);

    const updatedList = boardReducer(addedList, BoardActions.updateList({ list: { id: 11, name: 'Done' } }));
    expect(updatedList.lists.find(list => list.id === 11)?.name).toBe('Done');

    const failed = boardReducer(updatedList, BoardActions.loadBoardFailure({ error: 'boom' }));
    expect(failed.error).toBe('boom');

    const cleared = boardReducer(failed, BoardActions.clearBoard());
    expect(cleared).toEqual(initialState);
  });

  it('evaluates board selectors', () => {
    const state = {
      board: {
        board: { id: 1 },
        lists: [{ id: 10 }],
        cards: [
          { id: 1, listId: 10, position: 2, isArchived: false, isOverdue: true },
          { id: 2, listId: 10, position: 1, isArchived: false, isOverdue: false },
          { id: 3, listId: 11, position: 3, isArchived: true, isOverdue: true }
        ],
        loading: true,
        error: 'err'
      }
    };

    expect(selectBoard(state as any)?.id).toBe(1);
    expect(selectLists(state as any).length).toBe(1);
    expect(selectAllCards(state as any).length).toBe(3);
    expect(selectLoading(state as any)).toBeTrue();
    expect(selectError(state as any)).toBe('err');
    expect(selectCardsByList(10)(state as any).map(card => card.id)).toEqual([2, 1]);
    expect(selectOverdueCards(state as any).map(card => card.id)).toEqual([1, 3]);
  });
});
