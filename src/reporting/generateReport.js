function generateReport(tree, parent = null, path = []) {
    let report = '';
    if (tree) {
        for (const [packageName, info] of Object.entries(tree)) {
            const currentPath = [...path, packageName];
            if (info.isUnmaintained) {
                report += `Unmaintained Package: ${packageName}@${info.version}\n`;
                report += `Dependency Path: ${currentPath.join(' -> ')}\n`;
                report += `Unmaintained For: ${info.unmaintainedYears} years\n\n`;
            }
            if(Object.keys(info.dependencies).length) {
                report += generateReport(info.dependencies, packageName, currentPath);
            }
        }
    }
    return report ? report : 'No unmaintained dependencies found.';
}

export default generateReport;
