#!/bin/bash

# why use a python script when you can use bash (spoiler: you shouldn't)

#################### Error handling ####################
handle_error() {
    echo "An error occurred on line $1. Exiting Script..."
    exit 1
}

trap 'handle_error $LINENO' ERR

# check if docker-compose.bak exists, if so exit since the script doesn't support being more than once
if [ -f ./docker-compose.bak ]; then
    # remove the docker-compose.yml file, rename the backup to docker-compose.yml and remove the pepper folder, ask for confirmation first
    read -p "Script has already been run, do you want to revert the changes so that it can start anew? (y/n)"
    if [[ "$REPLY" =~ ^[Yy]$ ]]; then
        rm ./docker-compose.yml
        mv ./docker-compose.bak ./docker-compose.yml
        rm -rf ./pepper
    else
        echo "Exiting script..."
        exit 1
    fi
fi

#################### PREREQUISITES ####################
if ! command -v ex &>/dev/null; then
    echo "ex could not be found"
    exit 1
fi

if ! command -v docker &>/dev/null; then
    echo "docker could not be found"
    exit 1
fi

if ! command -v docker compose &>/dev/null; then
    echo "docker compose could not be found"
    exit 1
fi

inst_docker_compose_ver="$(docker compose version --short)"
req_docker_compose_ver="2.20"
if [ ! "$(printf '%s\n' "$req_docker_compose_ver" "$inst_docker_compose_ver" | sort -V | head -n1)" = "$req_docker_compose_ver" ]; then
    echo "docker compose version $req_docker_compose_ver or higher is required"
    exit 1
fi

#################### VARIABLES ####################
declare -A repository_mapping

repository_mapping[NodeRedBase]="https://github.com/Robotics-Empowerment-Designer/RED-Platform.git"
repository_mapping[Pepper]="https://github.com/Robotics-Empowerment-Designer/RED-Pepper-Middleware.git"
# repository_mapping[Temi]="NYI"
# repository_mapping[Sawyer]="NYI"

declare -A env_var_mapping

env_var_mapping[NodeRedBase]="NODE_RED_PORT HOSTNAME NODE_RED_LOG_LEVEL PEPPER_REST_SERVER_IP PEPPER_REST_SERVER_PORT OPENAI_API_KEY"
env_var_mapping[Pepper]="ROBOT_IP_PEPPER NODE_RED_PORT_PEPPER QI_LOG_LEVEL MQTT_PORT_PEPPER ROBOT_NAME_PEPPER REST_LOG_LEVEL FLASK_IP_PEPPER FLASK_PORT_PEPPER HOSTNAME"
# env_var_mapping[Temi]="TEMI_PORT TEMI_ADDRESS" # NYI
# env_var_mapping[Sawyer]="SAWYER_IP SAWYER_PORT" # NYI

robot_options=("Pepper" "Temi - NYI" "Sawyer - NYI")
preselection=("true" "false" "false")

source $(dirname $0)/env_vars.sh                     # env vars configuration logic
source $(dirname $0)/menu.sh                         # menu logic
multiselect "true" result robot_options preselection # menu logic

combined_folder_name="node_red"
idx=0
for option in "${robot_options[@]}"; do
    if [[ ${result[idx]} == true ]]; then combined_folder_name+="_${option@L}"; fi # create versionspecific folder name
    ((++idx))
done

# check if .git folder exists if .git/config file contains the correct remote url, if not check if current folder is empty
if [[ -d .git ]] && [[ "$(git config --get remote.origin.url):u" = *"RED"* ]]; then
    echo "Detected git repository with correct remote url. Skipping cloning of base node-red repo."
else
    echo "Script seems to be in a folder that is not a git repository or the remote url is not correct. Cloning base node-red repo."
    mkdir "$combined_folder_name"
    cd "$combined_folder_name"
    git clone --single-branch --branch master "${repository_mapping[NodeRedBase]}" . --depth 1 # clone base node-red repo
fi

cp ./docker-compose.yml ./docker-compose.bak # create backup of docker-compose.yml incase something goes wrong

idx=0
for option in "${robot_options[@]}"; do

    if [[ ${result[idx]} == true ]]; then                                                                    # only if the user selected the option
        git clone --single-branch --branch master "${repository_mapping[$option]}" "./${option@L}" --depth 1 # clone robot specific repo

        if [ -f "./${option@L}/docker-compose-module.yml" ]; then # only if the cloned repository has the file created specifically for this purpose (i.e. to be used as a module) will we add it
            path_to_compose_module="./${option@L}/docker-compose-module.yml"
            grep -q "include:" docker-compose.yml || printf '%s\n' 1a "include:" . x | ex docker-compose.yml
            grep -q "${path_to_compose_module}" docker-compose.yml || printf '%s\n' 2a "  - ./${option@L}/docker-compose-module.yml" . x | ex docker-compose.yml

            cd "./${option@L}/"
            sh ./buildContainers.sh
            cd ..
        else
            echo "WARNING: docker-compose-module.yml not found, module for ${option} won't be included."
            read -p "Do you want to continue with the other options? (Y/n) " continue
            if [[ "$continue" =~ ^[Nn]$ ]]; then
                break
            fi
        fi
    fi

    ((++idx))
done

chmod +x ./buildContainers.sh
sh ./buildContainers.sh

#################### ENV VARS ####################
echo ${env_var_mapping[NodeRedBase]}
update_env .env "${env_var_mapping[NodeRedBase]}"
idx=0
for option in "${robot_options[@]}"; do # duplicated, yes but better UX (IMO) => the user configures all the vars after the installation

    if [[ "${result[idx]}" == true ]]; then # only if the user selected the option
        if [ -f ./${option@L}/.env ]; then
            update_env "./${option@L}/.env" "${env_var_mapping[$option]}" # update env vars
        else
            echo "WARNING: .env not found, env vars for ${option} won't be updated."
            read -p "Do you want to continue with the other options? (Y/n) " continue
            if [[ "$continue" =~ ^[Nn]$ ]]; then
                break
            fi
        fi
    fi

    ((++idx))
done

echo "Trying to start containers, additional permissions required..."
sudo docker compose up --build