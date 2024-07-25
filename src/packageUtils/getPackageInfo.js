async function getPackageInfo(packageName) {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`);
    return await response.json();
}

export default getPackageInfo;
