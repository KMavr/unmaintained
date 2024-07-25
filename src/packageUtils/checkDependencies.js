import getUnmaintainedInfo from "./getUnmaintainedInfo.js";

async function checkDependencies(dependencies, parent = null, tree = {}) {
    if (dependencies) {
        for (const [packageName, info] of Object.entries(dependencies)) {
            const repositoryUrl = info.resolved || info.from;
            const { isUnmaintained, unmaintainedYears } = await getUnmaintainedInfo(packageName, repositoryUrl);

            tree[packageName] = {
                version: info.version,
                isUnmaintained,
                unmaintainedYears,
                dependencies: {},
                parent: parent,
            };

            if (info.dependencies) {
                await checkDependencies(info.dependencies, packageName, tree[packageName].dependencies);
            }
        }
        return tree;
    }
    return null;
}

export default checkDependencies;
