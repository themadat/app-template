# Git terminal setup on two Macs

Use these steps once on each laptop. Generate a separate SSH key on each machine; add both public keys to GitHub and never copy a private key between computers. Terminal Git access is separate from the app’s optional browser-based GitHub Sync token.

Replace the all-caps placeholders before running a command. On a managed work laptop, follow the employer’s source-control and key-storage policy.

## Personal laptop

Confirm that Git is available, then set the author attached to commits made from the personal laptop:

```sh
git --version
git config --global user.name "YOUR NAME"
git config --global user.email "YOUR PERSONAL GITHUB EMAIL"
git config --global init.defaultBranch main
git config --global pull.ff only
git config --global fetch.prune true
git config --global push.autoSetupRemote true
```

Inspect existing keys before creating anything:

```sh
ls -al ~/.ssh
```

If `~/.ssh/id_ed25519` and `~/.ssh/id_ed25519.pub` do not already exist, create a personal-laptop key. Accept the displayed default path and use a passphrase:

```sh
ssh-keygen -t ed25519 -C "YOUR PERSONAL GITHUB EMAIL"
eval "$(ssh-agent -s)"
/usr/bin/ssh-add --apple-use-keychain ~/.ssh/id_ed25519
pbcopy < ~/.ssh/id_ed25519.pub
```

In GitHub, open **Settings → SSH and GPG keys → New SSH key**, label it `Personal laptop`, and paste the copied public key. Then verify the connection:

```sh
ssh -T git@github.com
```

## Work laptop

Run the same Git defaults with the name and email that the work GitHub account or organization expects:

```sh
git --version
git config --global user.name "YOUR NAME"
git config --global user.email "YOUR WORK GITHUB EMAIL"
git config --global init.defaultBranch main
git config --global pull.ff only
git config --global fetch.prune true
git config --global push.autoSetupRemote true
```

Inspect existing keys first. If the default Ed25519 key does not exist, create a new key on this laptop; do not transfer the personal laptop’s private key:

```sh
ls -al ~/.ssh
ssh-keygen -t ed25519 -C "YOUR WORK GITHUB EMAIL"
eval "$(ssh-agent -s)"
/usr/bin/ssh-add --apple-use-keychain ~/.ssh/id_ed25519
pbcopy < ~/.ssh/id_ed25519.pub
```

Add that public key to the appropriate GitHub account as `Work laptop`. If the organization enforces SAML SSO, authorize the key for the organization from the key’s GitHub settings page. Then test it:

```sh
ssh -T git@github.com
```

## Keep the key available after restarting

On each laptop, create the SSH client config if it is missing, then open it in TextEdit:

```sh
touch ~/.ssh/config
chmod 600 ~/.ssh/config
open -e ~/.ssh/config
```

Keep any existing entries and add this block once:

```text
Host github.com
  AddKeysToAgent yes
  UseKeychain yes
  IdentityFile ~/.ssh/id_ed25519
```

If the key has no passphrase, omit `UseKeychain yes`. GitHub documents this macOS Keychain setup in [Generating a new SSH key and adding it to the ssh-agent](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent).

## Clone and use the repository

Run this on each laptop after its SSH test succeeds:

```sh
git clone git@github.com:OWNER/REPOSITORY.git
cd REPOSITORY
git remote -v
git status
```

The normal edit-and-push sequence is:

```sh
git pull --ff-only
git add PATHS-YOU-CHANGED
git commit -m "VERSION - Describe the completed change"
git push origin main
```

Before the first push, confirm `git status` lists only intentional files. Never paste a GitHub token or an SSH private key into a repository, command, issue, or chat.

## Existing key or authentication trouble

Do not rerun `ssh-keygen` over an existing key. Load the existing key and copy its public half instead:

```sh
eval "$(ssh-agent -s)"
/usr/bin/ssh-add --apple-use-keychain ~/.ssh/id_ed25519
pbcopy < ~/.ssh/id_ed25519.pub
ssh-add -l
ssh -vT git@github.com
```

GitHub normally answers a successful `ssh -T` test with an authentication-success message and notes that shell access is unavailable. That final note—and exit status 1—is expected, as described in [Testing your SSH connection](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/testing-your-ssh-connection).
