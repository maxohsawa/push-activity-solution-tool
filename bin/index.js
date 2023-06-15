#! /usr/bin/env node 
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import { readFileSync, readdirSync } from 'fs';
const { instructorRepo, studentRepo, remoteBranch } = JSON.parse(
  readFileSync(
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

    const instructorDirs = await readdirSync(`${instructorRepo}/01-Class-Content`);

    const unitName = instructorDirs.filter(dir => dir[0] === prefix[0] && dir[1] === prefix[1])[0];

    const unitActivityDirs = await readdirSync(`${instructorRepo}/01-Class-Content/${unitName}/01-Activities`);
    let filteredActivityDirs = unitActivityDirs.filter(dir => dir !== '.DS_Store');
    filteredActivityDirs = filteredActivityDirs.filter(dir => parseInt(dir.slice(0,2)) % 2 === 0);
    console.log(1, filteredActivityDirs);
    filteredActivityDirs = filteredActivityDirs.filter(dir => {
      // filter out folders that have a Solved folder
      const subDirs = readdirSync(`${studentRepo}/${unitName}/01-Activities/${dir}`);
      console.log(2, subDirs);
      return (!subDirs.includes('Solved'));
    });
    console.log(3, filteredActivityDirs);

    const unitAlgorithmDirs = await readdirSync(`${instructorRepo}/01-Class-Content/${unitName}/03-Algorithms`);
    let filteredAlgorithmDirs = unitActivityDirs.filter(dir => dir !== '.DS_Store');
    filteredAlgorithmDirs = filteredAlgorithmDirs.filter(dir => parseInt(dir.slice(0,2)) % 2 === 0);
    filteredAlgorithmDirs = await Promise.all(filteredAlgorithmDirs.filter(async dir => {
      // filter out folders that have a Solved folder
      const subDirs = await readdirSync(`${studentRepo}/${unitName}/01-Activities/${dir}`);
      return (!(subDirs.includes('Solved') || subDirs.includes('Main')));
    }));
    
    const choices = [
      ...unitActivityDirs     
        .filter(dir => dir !== '.DS_Store')
        .filter(dir => parseInt(dir.slice(0,2)) % 2 === 0)
        .filter(dir => {
          // filter out folders that have a Solved folder
          const subDirs = readdirSync(`${studentRepo}/${unitName}/01-Activities/${dir}`);
          return (!(subDirs.includes('Solved') || subDirs.includes('Main')));
        })
        .map(dir => {
          console.log(dir)
          return (
            {
              name: `Activity ${dir}`,
              value: `Activity ${dir}` 
            }
          )
      }),
      ...unitAlgorithmDirs
        .filter(dir => dir !== '.DS_Store')
        .filter(dir => parseInt(dir.slice(0,2)) % 2 === 0)
        .filter(dir => {
          // filter out folders that have a Solved folder
          const subDirs = readdirSync(`${studentRepo}/${unitName}/03-Algorithms/${dir}`);
          return (!subDirs.includes('Solved'));
        })
        .map(dir => {
          return ({
            name: `Algorithm ${dir}`,
            value: `Algorithm ${dir}` 
          })
        })
    ] 

    console.log(choices);
    // inquirer
    //   .prompt([
    //     {
    //       type: 'checkbox',
    //       name: 'solutions',
    //       message: 'Which solutions would you like to provide?',
    //       choices
    //     }
    //   ])
    //   .then(async ({ solutions }) => {

    //     const activities = solutions.filter(sol => sol.split(' ')[0] === 'Activity').map(sol => sol.split(' ')[1]);
    //     const algorithms = solutions.filter(sol => sol.split(' ')[0] === 'Algorithm').map(sol => sol.split(' ')[1]);

    //     console.log(activities, algorithms);

        // try {

        //   log(`Copying unit ${unitName} activity ${activityName} solution directory..`);

        //   execSync(`cp -r ${instructorRepo}/01-Class-Content/${unitName}/01-Activities/${activityName}/Solved ${studentRepo}/${unitName}/01-Activities/${activityName}`);

        //   log(`${activityName} solution copied..`);
        //   log("git adding all..");

        //   execSync(`cd ${studentRepo} && git add -A`);

        //   log("git commiting with message..");

        //   execSync(`cd ${studentRepo} && git commit -m "adds solution for unit ${unitName} activity ${activityName}"`);

        //   log("git pushing")

        //   execSync(`cd ${studentRepo} && git push ${remoteBranch}`);

        //   log("Completed.");

        // } catch(err) {
        //   console.error(err);
        // }
      // })

      });