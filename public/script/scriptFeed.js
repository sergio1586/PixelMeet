var etiquetasUsuario = [];
document.addEventListener('DOMContentLoaded', function() {
    cargarEtiquetasUsuario().then(() => {
        console.log(etiquetasUsuario);
        cargarFeed();
    }).catch(error => {
        console.error('Error al cargar las etiquetas del usuario:', error);
    });
});
function cargarEtiquetasUsuario() {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'GET',
            url: '/obtenerEtiquetasUsuario',
            success: function(response) {
                etiquetasUsuario = response.etiquetas;
                resolve();
            },
            error: function(error) {
                reject(error);
            }
        });
    });
}

function cargarFeed() {
    $.ajax({
        type: 'GET',
        url: '/cargarFeed',
        success: function(response) {
            if (response && response.publicaciones && response.publicaciones.length > 0) {
                var feed = $('#feed');
                feed.empty();

                // Ordenar las publicaciones de acuerdo a las etiquetas del usuario
                var sortedPublicaciones = ordenarPublicaciones(response.publicaciones, etiquetasUsuario);

                // Renderizar las publicaciones ordenadas
                $.each(sortedPublicaciones, function(index, publicacion) {
                    const imgContainer = $('<div>', {
                        'class': 'image-container',
                        'style': 'position: relative; margin: 10px auto;',
                        'data-publicacion-id': publicacion._id
                    });

                    var imgElement = $('<img>', {
                        src: `/${publicacion.imagePath}`,
                        'class': 'feed-img',
                        'click': function() {
                            cargarModal(publicacion);
                        }
                    });

                    var userLabel = $('<div>', {
                        'class': 'user-label'
                    });

                    var userLink = $('<a>', {
                        'href': `/perfil/${publicacion.username}`,
                        'text': `@${publicacion.username}`,
                        'style': 'color: blue; text-decoration: underline; cursor: pointer;'
                    });

                    userLabel.append(userLink);

                    var descripcionDiv = $('<div>', {
                        'class': 'descripcion'
                    });

                    var categoria = `<span class="categoria">#${publicacion.categoria}</span>`; // Añadir la categoría
                    if (publicacion.descripcion) {
                        var shortText = `<strong>${publicacion.username}</strong> ${publicacion.descripcion.substring(0, 100)}... ${categoria}`;
                        var fullText = `<strong>${publicacion.username}</strong> ${publicacion.descripcion} ${categoria}`;
                        var isShort = true;

                        if (publicacion.descripcion.length > 100) {
                            descripcionDiv.html(shortText);

                            var verMasButton = $('<button>', {
                                'text': 'Ver más',
                                'class': 'ver-mas-button',
                                'click': function(e) {
                                    e.preventDefault();
                                    toggleDescription(descripcionDiv, verMasButton, shortText, fullText, isShort).then(updatedState => {
                                        isShort = updatedState;
                                    });
                                }
                            });

                            descripcionDiv.append(verMasButton);
                        } else {
                            descripcionDiv.html(fullText);
                        }
                    } else {
                        descripcionDiv.html(`<strong>${publicacion.username}</strong> ${categoria}`);
                    }

                    var likesLabel = $('<div>', {
                        'class': 'likes-label',
                        'text': `${publicacion.meGustas.length} Me gusta`
                    });

                    showLike(publicacion._id).then(likeButtonHtml => {
                        var likeButton = $('<button>', {
                            'class': 'like-button',
                            'html': likeButtonHtml,
                            'click': function() {
                                toggleLike(publicacion._id);
                            }
                        });

                        var commentButton = $('<button>', {
                            'class': 'comment-button',
                            'html': '<img src="/images/comente.png" alt="Comentario">',
                            'click': function() {
                                cargarModal(publicacion);
                            }
                        });

                        var commentsContainer = $('<div>', {
                            'class': 'comments-container'
                        });

                        $.each(publicacion.comentarios, function(index, comentario) {
                            var commentElement = $('<div>', {
                                'class': 'comment',
                                'html': `<strong>${comentario.usuario}</strong> ${comentario.texto}`
                            });
                            commentsContainer.append(commentElement);
                        });

                        var commentBox = $('<textarea>', {
                            'class': 'comment-box',
                            'placeholder': 'Añade un comentario...'
                        });

                        var commentSubmitButton = $('<button>', {
                            'class': 'comment-submit-button',
                            'click': function() {
                                var comentarioTexto = commentBox.val();
                                if (comentarioTexto) {
                                    addComment(publicacion._id, comentarioTexto);
                                }
                            }
                        });

                        var submitButtonImage = $('<img>', {
                            'src': 'images/enviar.png',
                            'alt': 'Enviar',
                            'class': 'submit-button-image'
                        });

                        commentSubmitButton.append(submitButtonImage);

                        var commentContainer = $('<div>', {
                            'class': 'comment-container'
                        });

                        commentContainer.append(commentBox).append(commentSubmitButton);

                        imgContainer.append(imgElement.addClass('feed-img'))
                            .append(userLabel)
                            .append(descripcionDiv)
                            .append(likesLabel)
                            .append(likeButton)
                            .append(commentButton)
                            .append(commentsContainer)
                            .append(commentContainer);

                        feed.append(imgContainer);
                    }).catch(error => {
                        console.error('Error al obtener el botón de me gusta:', error);
                    });
                });
            } else {
                console.log('No hay publicaciones en el feed.');
            }
        },
        error: function(error) {
            console.error('Error al cargar el feed:', error);
        }
    });
}

function ordenarPublicaciones(publicaciones, userEtiquetas) {
    // Filtra y separa las publicaciones que coinciden con las etiquetas del usuario
    let preferidas = publicaciones.filter(pub => userEtiquetas.includes(pub.categoria));
    let noPreferidas = publicaciones.filter(pub => !userEtiquetas.includes(pub.categoria));

    // Mezcla aleatoriamente las publicaciones en cada grupo
    preferidas = preferidas.sort(() => Math.random() - 0.5);
    noPreferidas = noPreferidas.sort(() => Math.random() - 0.5);

    // Combina los dos grupos, preferidas primero
    console.log([...preferidas, ...noPreferidas])
    return [...preferidas, ...noPreferidas];
}

function cargarModal(publicacion){
    $('#modalImage').attr('src', `/${publicacion.imagePath}`).data('publicacion-id', publicacion._id);
    $('#modalUserProfilePic').attr('src', `/${publicacion.imagenPerfil}`);
    $('#modalUserProfileLink').attr('href', `/perfil/${publicacion.username}`).text(`@${publicacion.username}`);
    var categoria = `<span class="categoria">#${publicacion.categoria}</span>`; // Añadir la categoría
    $('#modalDescription').html(`<strong>${publicacion.username}</strong> ${publicacion.descripcion} ${categoria}`);
    $('#modalComments').empty();
    $.each(publicacion.comentarios, function(index, comentario) {
        var commentElement = $('<div>', {
            'class': 'comment',
            'html': `<strong>${comentario.usuario}</strong> ${comentario.texto}`
        });
        $('#modalComments').append(commentElement);
    });
    $('#modalCommentBox').val('');
    showLike(publicacion._id).then(likeButtonHtml => {
        $('#modalLikeButton').html(likeButtonHtml);
        $('#modalLikeButton').off('click').on('click', function() {
            toggleLike(publicacion._id);
        });
    });

    // Configurar el botón de envío de comentarios en el modal
    $('#modalCommentSubmitButton').off('click').on('click', function() {
        var comentarioTexto = $('#modalCommentBox').val();
        if (comentarioTexto) {
            addComment(publicacion._id, comentarioTexto);
            $('#modalCommentBox').val(''); // Limpiar la caja de comentarios
        }
    });

    $('#imageModal').modal('show');
}
function toggleLike(publicacionId) {
    $.ajax({
        type: 'POST',
        url: '/me-gusta',
        data: JSON.stringify({ publicacionId: publicacionId }),
        contentType: 'application/json',
        success: function(response) {
            if (response && response.likesCount !== undefined) {
                var publicacionContainer = $(`[data-publicacion-id="${publicacionId}"]`);
                var likesLabel = publicacionContainer.find('.likes-label');
                likesLabel.text(`${response.likesCount} Me gusta`);
            }
            showLike(publicacionId);
        },
        error: function(error) {
            console.error('Error al gestionar "me gusta":', error);
        }
    });
}


function subirImagen() {
    const fileInput = document.getElementById('inputImagen');
    const descripcion = document.getElementById('inputDescripcion');
    const categoriaInput = document.getElementById('categoria');
    const formData = new FormData();
    formData.append('imagen', fileInput.files[0]);
    formData.append('descripcion', descripcion.value);
    formData.append('categoria', categoriaInput.value);

    $.ajax({
        type: 'POST',
        url: '/upload',
        data: formData,
        contentType: false,
        processData: false,
        success: function(response) {
            console.log('Imagen subida correctamente');
            console.log('Ruta de la imagen:', response.imagePath);
            alert('Imagen subida correctamente');

            $('#uploadModal').modal('hide');
            cargarPublicacionesUsuario();
            cargarPerfil();
        },
        error: function(error) {
            console.error('Error al subir la imagen:', error);
        }
    });
}

function toggleDescription(descripcionDiv, verMasButton, shortText, fullText, isShort) {
    return new Promise((resolve) => {
        if (isShort) {
            descripcionDiv.html(fullText).append(verMasButton.text('Ver menos'));
            resolve(false);
        } else {
            descripcionDiv.html(shortText).append(verMasButton.text('Ver más'));
            resolve(true);
        }
    });
}

function addLike(publicacionId) {
    $.ajax({
        type: 'POST',
        url: '/me-gusta',
        data: JSON.stringify({ publicacionId: publicacionId }),
        contentType: 'application/json',
        success: function(response) {
            console.log(response); // Ver la respuesta del servidor
            var publicacionContainer = $(`[data-publicacion-id="${publicacionId}"]`);
            var likeButton = publicacionContainer.find('.like-button');
            //var likesLabel = publicacionContainer.find('.likes-label');
            
            // Actualizar el botón de "me gusta" en el feed
            if (!response.status) {
                likeButton.html('<img src="/images/me-gusta.png" alt="Me gusta">');
            } else {
                likeButton.html('<img src="/images/me-gusta2.png" alt="Me gusta">');
            }

            // Actualizar el conteo de "me gusta"
            //likesLabel.text(`${response.likesCount} Me gusta`);

            // Reasignar el evento de clic al botón de "me gusta" en el feed
            likeButton.off('click').on('click', function() {
                addLike(publicacionId);
            });

            // Actualizar el botón de "me gusta" en el modal si está visible
            if ($('#imageModal').hasClass('show') && $('#modalImage').data('publicacion-id') === publicacionId) {
                var modalLikeButton = $('#modalLikeButton');
                //var modalLikesLabel = $('#modalLikesLabel');

                if (response.status) {
                    modalLikeButton.html('<img src="/images/me-gusta.png" alt="Me gusta">');
                } else {
                    modalLikeButton.html('<img src="/images/me-gusta2.png" alt="Me gusta">');
                }

                //modalLikesLabel.text(`${response.likesCount} Me gusta`);

                // Reasignar el evento de clic al botón de "me gusta" en el modal
                modalLikeButton.off('click').on('click', function() {
                    addLike(publicacionId);
                });
            }
        },
        error: function(error) {
            console.error('Error al añadir "me gusta":', error);
        }
    });
}







function showLike(publicacionId) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'POST',
            url: '/me-gusta-o-no',
            data: JSON.stringify({ publicacionId: publicacionId }),
            contentType: 'application/json',
            success: function(response) {
                var likeButtonHtml;
                if (response.status) {
                    likeButtonHtml = '<img src="/images/me-gusta.png" alt="Me gusta">';
                } else {
                    likeButtonHtml = '<img src="/images/me-gusta2.png" alt="Me gusta">';
                }

                // Actualizar el botón de "me gusta" en el feed
                var publicacionContainer = $(`[data-publicacion-id="${publicacionId}"]`);
                var likeButton = publicacionContainer.find('.like-button');
                //var likesLabel = publicacionContainer.find('.likes-label');

                likeButton.html(likeButtonHtml);
                //likesLabel.text(`${response.likesCount} Me gusta`);

                likeButton.off('click').on('click', function() {
                    toggleLike(publicacionId);
                });

                // Actualizar el botón de "me gusta" en el modal si está visible
                if ($('#imageModal').hasClass('show') && $('#modalImage').data('publicacion-id') === publicacionId) {
                    var modalLikeButton = $('#modalLikeButton');
                    //var modalLikesLabel = $('#modalLikesLabel');

                    modalLikeButton.html(likeButtonHtml);
                    //modalLikesLabel.text(`${response.likesCount} Me gusta`);

                    modalLikeButton.off('click').on('click', function() {
                        toggleLike(publicacionId);
                    });
                }

                resolve(likeButtonHtml);
            },
            error: function(error) {
                console.error('Error al verificar "me gusta":', error);
                reject(error);
            }
        });
    });
}



function addComment(publicacionId, texto) {
    $.ajax({
        type: 'POST',
        url: '/comentario',
        data: JSON.stringify({ publicacionId: publicacionId, texto: texto }),
        contentType: 'application/json',
        success: function(response) {
            // Agregar el comentario al DOM
            var comentario = {
                usuario: response.usuario, // Asumiendo que el servidor devuelve el usuario
                texto: texto,
                fecha: new Date()
            };
            renderComment(publicacionId, comentario);
            // Limpiar el textarea
            $(`[data-publicacion-id="${publicacionId}"] .comment-box`).val('');
            $('#modalCommentBox').val(''); // Limpiar la caja de comentarios en el modal
        },
        error: function(error) {
            console.error('Error al añadir comentario:', error);
        }
    });
}


function renderComment(publicacionId, comentario) {
    // Actualizar comentarios en la página principal
    var publicacionContainer = $(`[data-publicacion-id="${publicacionId}"]`);
    var commentsContainer = publicacionContainer.find('.comments-container');

    var commentElement = $('<div>', {
        'class': 'comment',
        'html': `<strong>${comentario.usuario}</strong> ${comentario.texto}`
    });

    commentsContainer.append(commentElement);

    // Actualizar comentarios en el modal si está visible
    if ($('#imageModal').hasClass('show') && $('#modalImage').data('publicacion-id') === publicacionId) {
        var modalCommentsContainer = $('#modalComments');

        var modalCommentElement = $('<div>', {
            'class': 'comment',
            'html': `<strong>${comentario.usuario}</strong> ${comentario.texto}`
        });

        modalCommentsContainer.append(modalCommentElement);
    }
}


function seguirUsuario(username) {
    $.ajax({
        type: 'POST',
        url: '/seguir',
        data: JSON.stringify({ username: username }),
        contentType: 'application/json',
        success: function(response) {
            alert(response.message);
            cargarFeed();
        },
        error: function(error) {
            if (error.responseJSON && error.responseJSON.message) {
                alert(error.responseJSON.message);
            } else {
                console.error('Error al seguir al usuario:', error);
            }
        }
    });
}

function dejarDeSeguirUsuario(username) {
    $.ajax({
        type: 'POST',
        url: '/dejar-de-seguir',
        data: JSON.stringify({ username: username }),
        contentType: 'application/json',
        success: function(response) {
            alert(response.message);
            cargarFeed();
        },
        error: function(error) {
            if (error.responseJSON && error.responseJSON.message) {
                alert(error.responseJSON.message);
            } else {
                console.error('Error al dejar de seguir al usuario:', error);
            }
        }
    });
}
