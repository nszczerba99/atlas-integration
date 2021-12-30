import * as path from 'path';

export const getPackageFiltersFilePath = (athenaPath: string): string => {
	return path.join(athenaPath, '..', 'package_filters.txt');
};