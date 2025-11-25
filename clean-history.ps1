# Script to clean API keys from git history
$key = "AIzaSyCz6pgk8hlt5hyP-QERlw-TLXtft-B-bH8"
$replacement = "process.env.NEXT_PUBLIC_FIREBASE_API_KEY || `"`""

# Get all commits
$commits = git log --all --format="%H"

foreach ($commit in $commits) {
    $files = git ls-tree -r --name-only $commit | Where-Object { $_ -match "(firebase\.ts|createDemoProvider\.ts)" }
    
    foreach ($file in $files) {
        $content = git show "$commit`:$file" 2>$null
        if ($content -match $key) {
            Write-Host "Found key in $commit : $file"
        }
    }
}

