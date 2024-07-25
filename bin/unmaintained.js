#!/usr/bin/env node

import { exec } from "child_process";
import {checkDependencies, generateReport} from "../src/index.js";


exec('npm ls --json', async (err, stdout, stderr) => {
    if (err) {
        console.error('Error fetching dependencies:', stderr);
        return;
    }
    const dependencies = JSON.parse(stdout).dependencies;
    const tree = await checkDependencies(dependencies);
    const report = generateReport(tree);
    console.log(report);
});
