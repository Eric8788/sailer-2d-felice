# Eric Setup Notes

This repository is the independent Felice edition of Sailer 2D.

## GitHub setup

Create an empty GitHub repository:

```text
https://github.com/Eric8788/sailer-2d-felice
```

Do not initialize it with README, `.gitignore`, or license, because this local
repository already has those files.

Then push from Eric's computer:

```bash
cd /Users/eric/Desktop/AI/AI-CLUB/sailer-2d-felice
git push -u origin main
```

## Invite Felice

In GitHub:

```text
Repository -> Settings -> Collaborators -> Add people
```

Invite Felice's own GitHub account. Do not share Eric's GitHub token or account.

## Felice clone command

After she accepts the invitation:

```bash
git clone https://github.com/Eric8788/sailer-2d-felice.git
cd sailer-2d-felice
npm install
npm run dev
```

## Boundary

Felice should work in this repository, not Eric's main
`/Users/eric/Desktop/AI/AI-CLUB/sailer-2d` source folder.

If a Felice change should enter the main Sailer 2D project or Hub deployment,
Eric should review and copy/merge that change intentionally.

