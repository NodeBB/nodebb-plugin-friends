# nodebb-plugin-friends

Friendship plugin ala facebook

Replaces the default follow mechanic (ala Twitter) with a moderated friending system which allows users to approve/deny friend requests.


## Optional

If you want a friends button in the /users list, add the following in partials/users_list.tpl

```
<!-- IF users.isFriends -->
<button class="btn btn-link friend-button" data-uid="{users.uid}" data-type="unfriend" data-username="{users.username}">[[plugin-friends:action.remove-friend]]</button>
<!-- ELSE -->
<button class="btn btn-warning friend-button" data-uid="{users.uid}" data-type="friend" data-username="{users.username}">[[plugin-friends:action.add-friend]]</button>
<!-- ENDIF users.isFriends -->
```


## Integration with Write API

If you have the [Write API Plugin](https://github.com/julianlam/nodebb-plugin-write-api) installed, the following routes are exposed for you to use:

* `/friends/:uid`
    * `GET /`
        * Retrieves all friendship-related data pertaining to the user specified via `uid`, **including pending friendship data**
        * Can only be called by an administrative account
    * `POST /`
        * Requests a friendship from user specified via `userslug`, or accepts a pending friendship, if one is outstanding
        * Accepts: Nothing
    * `DELETE /`
        * Unfriends the user specified via `uid` (relative to the calling user), or rejects a friendship request, if one is outstanding
        * Accepts: Nothing
