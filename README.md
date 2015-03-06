# nodebb-plugin-friends

Friendship plugin ala facebook

Replaces the default follow mechanic (ala Twitter) with a moderated friending system which allows users to approve/deny friend requests.


## Optional

If you want a friends button in the /users list, add the following in partials/users_list.tpl

```
<!-- IF users.isFriends -->
<button class="btn btn-link friend-button" data-uid="{users.uid}" data-type="unfriend" data-username="{users.username}">Remove Friend</button>
<!-- ELSE -->
<button class="btn btn-warning friend-button" data-uid="{users.uid}" data-type="friend" data-username="{users.username}">Add Friend</button>
<!-- ENDIF users.isFriends -->
```