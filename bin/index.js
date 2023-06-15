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

log("This CLI tool copies over a Solved directory for a specific unit and activity from the instructor repo to the student repo, commits and pushes the changes to the student repo remote origin. Instructor and student repos should already exist and paths should be added to the config.json file. Remote name and branch name should also be added to config.json. Github SSH Key should be setup.");

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

    const unitAlgorithmDirs = await readdirSync(`${instructorRepo}/01-Class-Content/${unitName}/03-Algorithms`);
    
    const choices = [
      ...unitActivityDirs     
        .filter(dir => dir !== '.DS_Store')
        .filter(dir => parseInt(dir.slice(0,2)) % 2 === 0)
        .filter(dir => {
          // filter out activities for which the instructor repo doesn't have Solved or Main directory
          const subDirs = readdirSync(`${instructorRepo}/01-Class-Content/${unitName}/01-Activities/${dir}`);
          return (subDirs.includes('Solved') || subDirs.includes('Main'));
        })
        .filter(dir => {
          // filter out activities in the student repo that have a Solved or Main directory
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
    inquirer
      .prompt([
        {
          type: 'checkbox',
          name: 'solutions',
          message: 'Which solutions would you like to provide?',
          choices
        }
      ])
      .then(async ({ solutions }) => {

        const activities = solutions.filter(sol => sol.split(' ')[0] === 'Activity').map(sol => sol.split(' ')[1]);
        const algorithms = solutions.filter(sol => sol.split(' ')[0] === 'Algorithm').map(sol => sol.split(' ')[1]);

        try {
          
          activities.length && log(`Copying activities: ${activities.join(', ')}`);

          activities.forEach((activity) => {

            const folder = activity.slice(3) === 'Stu_Mini-Project' ? 'Main' : 'Solved';
  
            execSync(`cp -r ${instructorRepo}/01-Class-Content/${unitName}/01-Activities/${activity}/${folder} ${studentRepo}/${unitName}/01-Activities/${activity}`);
  
            log(`${activity} solution copied..`);
          });

          algorithms.length && log(`Copying algorithms: ${algorithms.join(', ')}`);

          algorithms.forEach((algorithm) => {
  
            execSync(`cp -r ${instructorRepo}/01-Class-Content/${unitName}/01-Activities/${algorithm}/Solved ${studentRepo}/${unitName}/01-Activities/${algorithm}`);
  
            log(`${algorithm} solution copied..`);
          });

          log(`Solutions copied..`);

          inquirer
            .prompt([
              {
                type: 'confirm',
                message: 'Would you like to add and commit changes?',
                name: "commit"
              }
            ])
            .then(({ commit }) => {

              if (!commit) return;

              log("git adding all..");
              execSync(`cd ${studentRepo} && git add -A`);
              log("git commiting with message..");
              const commitMessage = `"adds solution for unit ${unitName}${activities.length ? ' activities ' : ''}${activities.join(', ')}${algorithms.length ?' and algorithms ' : ''}${algorithms.join(', ')}"`;
              log(commitMessage);
              execSync(`cd ${studentRepo} && git commit -m ${commitMessage}`);

              inquirer
                .prompt([
                  {
                    type: "confirm",
                    message: `Would you like to push to ${remoteBranch}?`,
                    name: "pushToRemote"
                  }
                ])
                .then(({ pushToRemote }) => {

                  if (!pushToRemote) return;
                  log("git pushing")
                  execSync(`cd ${studentRepo} && git push ${remoteBranch}`);
                });
            });


        } catch(err) {
          console.error(err);
        }
      })

      });