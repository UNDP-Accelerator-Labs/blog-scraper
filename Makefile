help:
	@echo "The following make targets are available:"
	@echo "build	build the docker image"
	@echo "publish	deploys the next version with the current commit"
	@echo "azlogin	log in to azure container storage"
	@echo "name	generate a unique permanent name for the current commit"
	@echo "commit	print precise commit hash (with a * if the working copy is dirty)"
	@echo "branch	print current branch and exit"
	@echo "version-file	create the version file"
	@echo "current-version	computes the current version"
	@echo "next-version	computes the next version"
	@echo "git-check	ensures no git visible files have been altered"
	@echo "run-web	starts the server"

export LC_ALL=C
export LANG=C

build:
	./sh/build.sh

publish:
	./sh/deploy.sh

azlogin:
	./sh/azlogin.sh

dockerpush:
	./sh/dockerpush.sh

name:
	git describe --abbrev=10 --tags HEAD

commit:
	git describe --match NOTATAG --always --abbrev=40 --dirty='*'

branch:
	git rev-parse --abbrev-ref HEAD

version-file:
	./sh/versionfile.sh

current-version:
	./sh/version.sh --current

next-version:
	./sh/version.sh

git-check:
	./sh/git_check.sh

run-web:
	npm start 1>&2
