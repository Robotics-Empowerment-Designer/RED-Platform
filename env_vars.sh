function update_env {
    local file=$1
    local vars_string=$2
    local vars

    # Split the string into an array
    read -a vars <<<"$vars_string"

    for var in "${vars[@]}"; do
        if [ ! -f $file ]; then
            echo "WARNING: .env not found, env vars for ${file} won't be updated."
            break
        fi

        local line=$(grep "^$var=" "$file")
        local current_value=$(echo $line | cut -f2 -d= -s | cut -f1 -d# -s)
        local comment=$(echo $line | cut -f2 -d# -s)
        local console_output=$([ -z "${current_value// /}" ] && echo "NOT SET" || echo $current_value)

        clear

        echo -e "Configuration of $file"
        echo ""

        echo -e "Variable: $var"
        echo "Current value: $console_output"
        echo -e "Description:$comment\n"
        echo "Enter a new value or press enter to continue to the next variable:"
        read value

        if grep -q "^$var=" "$file"; then
            # Check if the user entered a value, if not keep the current one
            if [[ -z "$value" ]]; then
                continue
            fi
            # If the variable (string: 'VARIABLENAME=') exists, replace it
            sed -i "s/^\($var=\)[^#]*\(.*\)/\1$value \2/" "$file"
        else
            # If the variable doesn't exist, append it
            echo "$var=$value" >>"$file"
        fi
    done
}
