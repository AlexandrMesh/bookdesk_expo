import zipObject from 'lodash/zipObject';

export default (list: any[]) => zipObject(list, list);
