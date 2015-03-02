# nodebb-plugin-friends
Friendship plugin ala facebook

Place the below template in user_list replacing the follow buttons.
```
<!-- IF users.isFriends -->
<button class="btn btn-link friend-button" data-uid="{users.uid}" data-type="unfriend" data-username="{users.username}">Remove Friend</button>
<!-- ELSE -->
<button class="btn btn-warning friend-button" data-uid="{users.uid}" data-type="friend" data-username="{users.username}">Add Friend</button>
<!-- ENDIF users.isFriends -->
```