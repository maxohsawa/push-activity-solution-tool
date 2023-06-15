#! /usr/bin/env node 
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import { readFile, readdir } from 'fs/promises';
const { instructorRepo, studentRepo, remoteBranch } = JSON.parse(
  await readFile(
    new URL('../config.json', import.meta.url)
  )
);

function log(input) {
  console.log(`>_ ${input}`);
}

log(">_ This CLI tool copies over a Solved directory for a specific unit and activity from the instructor repo to the student repo, commits and pushes the changes to the student repo remote origin. Instructor and student repos should already exist and paths should be added to the config.json file. Remote name and branch name should also be added to config.json.");

inquirer
  .prompt([
    {
      type: 'number',
      name: 'unit',
      message: 'Which unit would you like to update?'
    }
  ])
  .then(async ({ unit }) => {

    const prefix = unit < 10 ? `0${unit}` : `${unit}`;

    const instructorDirs = await readdir(`${instructorRepo}/01-Class-Content`);

    const unitName = instructorDirs.filter(dir => dir[0] === prefix[0] && dir[1] === prefix[1])[0];

    inquirer
      .prompt([
        {
          type: 'number',
          name: 'activity',
          message: 'Which activity would you like to update?'
        }
      ])
      .then(async ({ activity }) => {
        const prefix = activity < 10 ? `0${activity}` : `${activity}`;

        const activityDirs = await readdir(`${instructorRepo}/01-Class-Content/${unitName}/01-Activities/`);

        const activityName = activityDirs.filter(dir => dir[0] === prefix[0] && dir[1] === prefix[1])[0];

        try {

          log(`Copying unit ${unitName} activity ${activityName} solution directory..`);

          execSync(`cp -r ${instructorRepo}/01-Class-Content/${unitName}/01-Activities/${activityName}/Solved ${studentRepo}/${unitName}/01-Activities/${activityName}`);

          log(`${activityName} solution copied..`);
          log("git adding all..");

          execSync(`cd ${studentRepo} && git add -A`);

          log("git commiting with message..");

          execSync(`cd ${studentRepo} && git commit -m "adds solution for unit ${unitName} activity ${activityName}"`);

          log("git pushing")

          execSync(`cd ${studentRepo} && git push ${remoteBranch}`);

          log("Completed.");

        } catch(err) {
          console.error(err);
        }
      })

      });