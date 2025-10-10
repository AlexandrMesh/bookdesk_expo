import { RootState } from '~redux/store/configureStore';

type StateWithBooks = Pick<RootState, 'books'>;
type StateWithCustomBook = Pick<RootState, 'customBook'>;

// Books selectors
const getBooks = (state: StateWithBooks) => state.books;
const getCategories = (state: StateWithBooks) => getBooks(state).categories;
export const getCategoriesData = (state: StateWithBooks) => getCategories(state).data;

// CustomBook selectors
const getCustomBook = (state: StateWithCustomBook) => state.customBook;
const getAddCustomBook = (state: StateWithCustomBook) => getCustomBook(state).add;
const getAddCustomBookSteps = (state: StateWithCustomBook) => getAddCustomBook(state).steps;
const getAddCustomBookStep3 = (state: StateWithCustomBook) => getAddCustomBookSteps(state)[3];
const getEditableCategory = (state: StateWithCustomBook) => getAddCustomBookStep3(state).editableCategory;
export const getExpandedCategories = (state: StateWithCustomBook) => getEditableCategory(state).expanded;
